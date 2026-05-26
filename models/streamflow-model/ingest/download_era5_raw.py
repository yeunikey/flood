#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ERA5-Land Raw Data Downloader
=============================

This script automates the retrieval of hourly ERA5-Land NetCDF data from the CDS API.
It is designed for production pipelines where local timezones and model-specific 
configurations (sequence length, variables) are stored in a PostgreSQL database.

MAIN FEATURES:
1.  Smart Date Resolution: 
    - Uses --issue-date + DB 'sequence_length' to calculate the lookback period.
    - Handles timezone offsets by downloading extra UTC days to ensure 100% coverage
      of the local day after ETL conversion.
2.  Database Integration:
    - Fetches BBOX/Geometry from PostGIS via --aoi-name.
    - Extracts required CDS variables from model config_json in the DB.
3.  Reliability:
    - Uses '.__SUCCESS__' flag files to skip completed downloads.
    - Atomic writes: cleans up failed/partial .nc files on error.

ARGUMENTS:
----------
TIME RANGE (Pick one):
    --issue-date : Local date (YYYY-MM-DD). Requires --model-name and --pg-url.
                   Calculates: start = issue_date - (seq_len - 1).
    --start/--end: Explicit local date range (YYYY-MM-DD).

GEOGRAPHY (Pick one):
    --bbox       : "minLon,minLat,maxLon,maxLat" (EPSG:4326).
    --aoi-name   : AOI name in 'aoi' table. Requires --pg-url.

DATA CONFIG:
    --tz         : (Required) IANA Timezone, e.g., 'Asia/Almaty' or 'UTC'.
    --pg-url     : PostgreSQL URL (postgresql://user:pass@host:port/db).
    --model-name : Model name in DB to fetch sequence_length and variables.
    --variables  : Comma-separated CDS names. Overrides DB config.

STORAGE:
    --model-raw-dir : Target directory for files. Overrides --base-dir/--out-subdir.
    --base-dir      : Base folder for storage (default: '.').
    --out-subdir    : Subfolder name (default: 'era5land_raw').

USAGE EXAMPLES:
---------------
# 1. Pipeline Mode (Automated for a model):
python download_era5_raw.py --issue-date 2025-09-02 --model-name "LSTM_Uba" \\
    --tz "Asia/Almaty" --pg-url "postgresql://u:p@localhost/db" \\
    --model-raw-dir "data/models/LSTM_Uba/raw"

# 2. Manual/Historical Mode:
python download_era5_raw.py --start 2023-01-01 --end 2023-01-10 \\
    --bbox "82.0,49.5,84.5,51.0" --tz "UTC" --variables "2m_temperature"


"""

import argparse           # for parsing command-line arguments (like --issue-date or --bbox).
import datetime as dt    
from pathlib import Path  
from typing import Tuple, List 
import sys                
# --- Dependency Section: External Libraries ---

try:
    import pytz           # for the IANA timezone database (translating "Asia/Almaty" into actual UTC offsets).
except Exception as e:

    print("ERROR: install pytz: pip install pytz", file=sys.stderr)
    raise

try:
    import cdsapi         # for the communication with the Copernicus Climate Data Store servers.
except Exception as e:
    
    print("ERROR: install cdsapi: pip install cdsapi", file=sys.stderr)
    raise

try:
    import psycopg        # for the PostgreSQL connection
except Exception:
    # If psycopg isn't installed, we set it to None. 
    # This allows the script to still work in "manual mode" (using --bbox) without needing a DB.
    psycopg = None


DATASET = "reanalysis-era5-land"

# Keep minimal defaults; for real use prefer model config_json
DEFAULT_VARS = [
    "2m_temperature",
    "total_precipitation",
    "snow_depth_water_equivalent",
    "soil_temperature_level_1",
    "volumetric_soil_water_layer_1",
]


# ----------------- DB helpers -----------------

def _require_psycopg():
    if psycopg is None:
        raise SystemExit("psycopg not installed. Install: pip install psycopg[binary]")


def get_model_config(pg_url: str, model_name: str, version: str) -> dict:
    """
    Fetch config_json for (model_name, version) from DB.
    Assumes your tables: models(model_id, model_name, ...), model_versions(model_id, version, config_json, ...)
    """
    _require_psycopg()
    with psycopg.connect(pg_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select v.config_json
                from model_versions v
                join models m using (model_id)
                where m.model_name=%s and v.version=%s
                """,
                (model_name, version),
            )
            row = cur.fetchone()
    if not row or row[0] is None:
        raise SystemExit(f"Model {model_name} v{version} not found in DB or config_json is NULL.")
    return row[0]


def get_model_required_cds_vars(cfg: dict) -> List[str]:
    """
    Extract needed CDS variables from config_json.features.dynamic[*].cds_variable
    and return unique sorted list.
    """
    feats = (cfg.get("features") or {}).get("dynamic") or []
    vars_needed = set()
    for f in feats:
        if isinstance(f, dict) and f.get("cds_variable"):
            vars_needed.add(f["cds_variable"])
    return sorted(vars_needed) if vars_needed else []


def get_model_sequence_length(cfg: dict) -> int:
    seq = cfg.get("sequence_length")
    if not isinstance(seq, int) or seq <= 0:
        raise SystemExit("config_json.sequence_length missing or invalid (must be positive int).")
    return seq


def parse_bbox(s: str) -> Tuple[float, float, float, float]:
    try:
        minlon, minlat, maxlon, maxlat = map(float, s.split(","))
        assert minlon < maxlon and minlat < maxlat
        return minlon, minlat, maxlon, maxlat
    except Exception:
        raise SystemExit('Invalid --bbox. Use "minLon,minLat,maxLon,maxLat" (EPSG:4326)')


def bbox_from_db(pg_url: str, aoi_name: str) -> Tuple[float, float, float, float]:
    """
    AOI bbox from table aoi geometry extent. Requires PostGIS.
    """
    _require_psycopg()
    with psycopg.connect(pg_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select ST_XMin(ext), ST_YMin(ext), ST_XMax(ext), ST_YMax(ext)
                from (select ST_Extent(geom) as ext from aoi where aoi_name=%s) s
                """,
                (aoi_name,),
            )
            row = cur.fetchone()

    if not row or any(v is None for v in row):
        raise SystemExit(f"AOI '{aoi_name}' not found or has empty geometry in table aoi.")
    return float(row[0]), float(row[1]), float(row[2]), float(row[3])


# ----------------- time helpers -----------------

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def parse_date(s: str) -> dt.date:
    try:
        return dt.date.fromisoformat(s)
    except Exception:
        raise SystemExit(f"Invalid date '{s}'. Use YYYY-MM-DD.")


def utc_days_needed_for_local_range(start_local: dt.date, end_local: dt.date, tzname: str) -> List[dt.date]:
    """
    Compute UTC dates that must be downloaded to fully cover LOCAL date range.
    We download full UTC days; later ETL slices to exact local 24h window.

    NOTE:
    For positive timezone offsets (e.g., Asia/Almaty), local midnight often maps to previous UTC day.
    We include a small buffer to avoid edge-case gaps.
    """
    tz = pytz.timezone(tzname)

    dt_start_local = tz.localize(dt.datetime.combine(start_local, dt.time(0, 0, 0)))
    dt_end_local = tz.localize(dt.datetime.combine(end_local, dt.time(23, 59, 59)))

    dt_start_utc = dt_start_local.astimezone(pytz.UTC)
    dt_end_utc = dt_end_local.astimezone(pytz.UTC)

    utc_start = dt_start_utc.date()
    utc_end = dt_end_utc.date()

    offset_hours = dt_start_local.utcoffset().total_seconds() / 3600.0
    if offset_hours > 0:
        # buffer both ends (safe; at most +2 files)
        utc_start = utc_start - dt.timedelta(days=1)
        utc_end = utc_end + dt.timedelta(days=1)

    days = []
    d = utc_start
    while d <= utc_end:
        days.append(d)
        d += dt.timedelta(days=1)
    return days


# ----------------- main -----------------

def main():
    p = argparse.ArgumentParser(description="Download raw ERA5-Land hourly NetCDFs (timezone-aware).")

    # Time arguments
    p.add_argument("--start", help="LOCAL start date YYYY-MM-DD (optional if using --issue-date)")
    p.add_argument("--end", help="LOCAL end date YYYY-MM-DD (optional if using --issue-date)")
    p.add_argument("--issue-date", help="LOCAL issue date YYYY-MM-DD (auto uses seq_len from model config)")
    p.add_argument("--tz", required=True, help="IANA timezone, e.g. Asia/Almaty or UTC")

    # Spatial arguments
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--bbox", type=str, help='minLon,minLat,maxLon,maxLat (EPSG:4326)')
    src.add_argument("--aoi-name", type=str, help="AOI name from table aoi (use with --pg-url)")
    p.add_argument("--pg-url", type=str, help="Postgres URL (required for --aoi-name and for --model-name)")

    # Data config arguments
    p.add_argument("--variables", type=str, default=None,
                   help="Comma-separated CDS variable names (if not using --model-name)")
    p.add_argument("--model-name", type=str, help="Model name from DB")
    p.add_argument("--model-version", type=str, default="v1.0", help="Model version from DB")

    # output paths
    p.add_argument("--base-dir", type=str, default=".", help="Base directory for storage")
    p.add_argument("--out-subdir", type=str, default="era5land_raw", help="Subfolder under base-dir for raw cache")
    p.add_argument(
        "--model-raw-dir",
        type=str,
        default=None,
        help="If set, store raw files under this directory (overrides --base-dir/--out-subdir).",
    )
    p.add_argument("--dataset", type=str, default=DATASET, help="CDS dataset id")

    args = p.parse_args()

    # ---------------- Resolve dates ----------------
    if args.issue_date:
        if not args.model_name:
            raise SystemExit("--issue-date requires --model-name (to read sequence_length from DB).")
        if not args.pg_url:
            raise SystemExit("--issue-date requires --pg-url (to read model config_json).")

        issue_date = parse_date(args.issue_date)
        cfg = get_model_config(args.pg_url, args.model_name, args.model_version)
        seq_len = get_model_sequence_length(cfg)

        start_local = issue_date - dt.timedelta(days=seq_len - 1)
        end_local = issue_date

        print(f"[DATES] issue_date={issue_date} seq_len={seq_len} -> start={start_local} end={end_local}")
    else:
        if not args.start or not args.end:
            raise SystemExit("Provide either --issue-date OR both --start and --end.")
        start_local = parse_date(args.start)
        end_local = parse_date(args.end)
        if start_local > end_local:
            raise SystemExit("Invalid date range: start > end.")

    # ---------------- Resolve bbox ----------------
    if args.bbox:
        minlon, minlat, maxlon, maxlat = parse_bbox(args.bbox)
    else:
        if not args.pg_url:
            raise SystemExit("Using --aoi-name requires --pg-url.")
        minlon, minlat, maxlon, maxlat = bbox_from_db(args.pg_url, args.aoi_name)

    # CDS area format: [north, west, south, east]
    area = [maxlat, minlon, minlat, maxlon]

    # ---------------- Choose variables ----------------
    variables: List[str] = []
    if args.model_name:
        if not args.pg_url:
            raise SystemExit("--model-name requires --pg-url to fetch config from DB.")
        cfg = get_model_config(args.pg_url, args.model_name, args.model_version)
        variables = get_model_required_cds_vars(cfg)

        if not variables:
            if args.variables:
                variables = [v.strip() for v in args.variables.split(",") if v.strip()]
            else:
                variables = DEFAULT_VARS
            print("[WARN] model config has no features.dynamic[*].cds_variable; using variables fallback.")
    elif args.variables:
        variables = [v.strip() for v in args.variables.split(",") if v.strip()]
    else:
        variables = DEFAULT_VARS


    # ---------------- Output path ----------------

    if args.model_raw_dir:
        out_base = Path(args.model_raw_dir).expanduser().resolve()
    else:
        out_base = (Path(args.base_dir) / args.out_subdir).expanduser().resolve()
    ensure_dir(out_base)

    # ---------------- Which UTC days are needed ----------------
    # Execute downloads
    utc_days = utc_days_needed_for_local_range(start_local, end_local, args.tz)
    print(f"[UTC] Need {len(utc_days)} UTC day files to cover local range {start_local}..{end_local}")
    print(f"[OUT] {out_base}")

    client = cdsapi.Client()

    for d in utc_days:
        day_dir = out_base / f"{d:%Y/%m/%d}"
        ensure_dir(day_dir)
        nc_path = day_dir / f"era5-land_{d:%Y%m%d}.nc"
        ok_flag = day_dir / ".__SUCCESS__"

        # Check cache: Only skip if both the file and the success flag exist
        if nc_path.exists() and ok_flag.exists():
            print(f"[SKIP] {d} already downloaded.")
            continue

        print(f"[CDS] {d} -> {nc_path.name}  vars={len(variables)}")
        try:
            client.retrieve(
                args.dataset,
                {
                    "variable": variables,
                    "year": f"{d.year}",
                    "month": f"{d:%m}",
                    "day": f"{d:%d}",
                    "time": [f"{h:02d}:00" for h in range(24)],
                    "area": area,
                    "format": "netcdf",
                },
                str(nc_path),
            )
            ok_flag.write_text("ok", encoding="utf-8")
        except Exception as e:
            print(f"[ERROR] {d}: {e}", file=sys.stderr)
            # If partial/invalid file exists, remove it so next run retries cleanly
            try:
                if nc_path.exists():
                    nc_path.unlink()
            except Exception:
                pass

    print("✅ Raw download done.")


if __name__ == "__main__":
    main()
