#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
etl_era5_raw_to_features_db.py

ETL: ERA5-Land raw daily files (24 hourly steps inside) -> daily AOI features -> Postgres.

Fixes included:
- local-day iteration (timezone aware) instead of raw UTC-file dates
- variable renaming from GRIB shortnames -> CDS names
- avoids composite types in SQL check (portable VALUES approach)
- auto-detects whether features_daily_aoi has column "source_ref"
  and inserts accordingly (no DB migration needed)

✅ NEW (requested for nightly automation):
- config_json parsing is robust (dict OR string)
- supports --start-date / --end-date to process ONLY the needed local range
  (prevents scanning the full archive every night)

Usage (Windows):
  python etl_era5_raw_to_features_db.py ^
    --pg-url "postgresql://app_writer:PASS@localhost:5432/hydro_forecasts" ^
    --model-name "LSTM_lumped_Uba" --model-version "v1.0" ^
    --aoi-name "Uba_basin" ^
    --tz Asia/Almaty ^
    --base-dir "./ingest/model_raw_data/LSTM_lumped_Uba/" ^
    --require-success-flag ^
    --skip-existing ^
    --start-date 2025-01-01 ^
    --end-date 2025-01-31
"""

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import List, Tuple, Optional, Any

import numpy as np
import pandas as pd
import xarray as xr
import psycopg
from zoneinfo import ZoneInfo

try:
    from shapely import wkt
    from shapely.prepared import prep
    from shapely.geometry import Point, box
except Exception as e:
    raise SystemExit("Install shapely:  pip install shapely") from e


# ---------------- DB SQL ----------------

GET_AOI_ID_SQL = "select aoi_id from aoi where aoi_name=%s"
GET_AOI_WKT_SQL = "select ST_AsText(geom) from aoi where aoi_name=%s"

GET_MODEL_CFG_SQL = """
select v.config_json
from model_versions v
join models m using (model_id)
where m.model_name=%s and v.version=%s
"""

CHECK_EXISTING_PAIRS_SQL_TEMPLATE = """
with req(variable, stat) as (
  values {values_sql}
)
select f.variable, f.stat
from features_daily_aoi f
join req r using (variable, stat)
where f.aoi_id = %s and f.date = %s
"""

UPSERT_WITH_SOURCE_REF_SQL = """
insert into features_daily_aoi (aoi_id, date, variable, stat, value, source_ref)
values (%s, %s, %s, %s, %s, %s)
on conflict (aoi_id, date, variable, stat)
do update set value=excluded.value, source_ref=excluded.source_ref, created_at=now();
"""

UPSERT_NO_SOURCE_REF_SQL = """
insert into features_daily_aoi (aoi_id, date, variable, stat, value)
values (%s, %s, %s, %s, %s)
on conflict (aoi_id, date, variable, stat)
do update set value=excluded.value, created_at=now();
"""

HAS_SOURCE_REF_SQL = """
select 1
from information_schema.columns
where table_schema='public'
  and table_name='features_daily_aoi'
  and column_name='source_ref'
limit 1;
"""


# ---------------- helpers ----------------

def parse_cfg(cfg: Any) -> dict:
    """Normalize config_json from DB: it may arrive as dict, string, bytes, or JSON-like."""
    if isinstance(cfg, dict):
        return cfg
    if isinstance(cfg, (str, bytes)):
        return json.loads(cfg)
    try:
        return dict(cfg)
    except Exception as e:
        raise TypeError(f"Unsupported config_json type: {type(cfg)}") from e


def detect_time_coord(ds: xr.Dataset) -> str:
    for cand in ("time", "valid_time", "forecast_time"):
        if cand in ds.coords or cand in ds.variables:
            return cand
    raise KeyError("No time coordinate found (tried: time, valid_time, forecast_time).")


def normalize_era5_ds(ds: xr.Dataset) -> xr.Dataset:
    # unify time coord
    if "time" not in ds.coords and "valid_time" in ds.coords:
        ds = ds.rename({"valid_time": "time"})

    # rename GRIB short -> CDS variable names
    rename_vars = {
        "t2m": "2m_temperature",
        "tp": "total_precipitation",
        "stl1": "soil_temperature_level_1",
        "swvl1": "volumetric_soil_water_layer_1",
        "sd": "snow_depth_water_equivalent",
    }
    present = {k: v for k, v in rename_vars.items() if k in ds.data_vars}
    if present:
        ds = ds.rename(present)

    return ds


def open_ds(path: Path) -> xr.Dataset:
    # Prefer netcdf4 first; fallback to cfgrib if file is GRIB renamed
    try:
        return xr.open_dataset(path, engine="netcdf4")
    except Exception:
        return xr.open_dataset(path, engine="cfgrib")


def local_day_window_to_utc(d_local: dt.date, tzname: str) -> Tuple[pd.Timestamp, pd.Timestamp]:
    tz = ZoneInfo(tzname)
    start_local = pd.Timestamp(dt.datetime(d_local.year, d_local.month, d_local.day, 0, 0), tz=tz)
    end_local = start_local + pd.Timedelta(days=1)
    return start_local.tz_convert("UTC"), end_local.tz_convert("UTC")


def utc_dates_needed(start_utc: pd.Timestamp, end_utc: pd.Timestamp) -> List[dt.date]:
    d0 = start_utc.date()
    d1 = (end_utc - pd.Timedelta(seconds=1)).date()
    return [d0] if d0 == d1 else [d0, d1]


def scan_raw_utc_dates(raw_root: Path) -> List[dt.date]:
    dates = []
    for p in raw_root.rglob("era5-land_*.nc"):
        name = p.name.replace("era5-land_", "").replace(".nc", "")
        try:
            d = dt.datetime.strptime(name, "%Y%m%d").date()
            dates.append(d)
        except Exception:
            continue
    return sorted(set(dates))


def build_local_days_from_raw_utc_dates(raw_utc_dates: List[dt.date], tzname: str) -> List[dt.date]:
    """
    Convert availability of UTC day-files into a list of LOCAL days that are computable
    (i.e., required UTC files for that local day exist).
    """
    if not raw_utc_dates:
        return []
    tz = ZoneInfo(tzname)
    utc_set = set(raw_utc_dates)

    min_utc = min(raw_utc_dates)
    max_utc = max(raw_utc_dates)

    start_local = (
        pd.Timestamp(dt.datetime(min_utc.year, min_utc.month, min_utc.day, 0, 0), tz="UTC")
        .tz_convert(tz).date()
    )
    end_local = (
        pd.Timestamp(dt.datetime(max_utc.year, max_utc.month, max_utc.day, 0, 0), tz="UTC")
        .tz_convert(tz).date()
    )

    # safe buffer so first/last local day that needs adjacent UTC file is included
    start_local = start_local - dt.timedelta(days=1)
    end_local = end_local + dt.timedelta(days=1)

    local_days = []
    d = start_local
    while d <= end_local:
        s_utc, e_utc = local_day_window_to_utc(d, tzname)
        needed = utc_dates_needed(s_utc, e_utc)
        if all(x in utc_set for x in needed):
            local_days.append(d)
        d += dt.timedelta(days=1)

    return sorted(set(local_days))


def load_model_spec(pg_url: str, model_name: str, model_version: str):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_MODEL_CFG_SQL, (model_name, model_version))
            row = cur.fetchone()

    if not row:
        raise SystemExit(f"Model config not found for {model_name} {model_version}")

    cfg = parse_cfg(row[0])
    feats = (cfg.get("features") or {}).get("dynamic") or []
    if not feats:
        raise SystemExit("config_json.features.dynamic is empty or missing.")

    required_pairs = [(f["db_variable"], f["stat"]) for f in feats]
    return cfg, feats, required_pairs


def parse_bbox(s: str):
    try:
        minlon, minlat, maxlon, maxlat = [float(v.strip()) for v in s.split(",")]
    except Exception as e:
        raise SystemExit('Invalid --aoi-bbox. Use "minLon,minLat,maxLon,maxLat".') from e

    if minlon >= maxlon or minlat >= maxlat:
        raise SystemExit("Invalid --aoi-bbox: min values must be lower than max values.")

    return minlon, minlat, maxlon, maxlat


def get_aoi(pg_url: str, aoi_name: str, aoi_bbox: Optional[str] = None):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_AOI_ID_SQL, (aoi_name,))
            r1 = cur.fetchone()

    if not r1:
        raise SystemExit(f"AOI not found: {aoi_name}")

    if aoi_bbox:
        minlon, minlat, maxlon, maxlat = parse_bbox(aoi_bbox)
        poly = box(minlon, minlat, maxlon, maxlat)
        return r1[0], poly, prep(poly)

    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_AOI_WKT_SQL, (aoi_name,))
            r2 = cur.fetchone()

    if not r2 or not r2[0]:
        raise SystemExit(f"AOI geom is NULL: {aoi_name}")

    aoi_id = r1[0]
    poly = wkt.loads(r2[0])
    return aoi_id, poly, prep(poly)


def make_aoi_mask(lat: np.ndarray, lon: np.ndarray, poly_prepared, poly_geom) -> np.ndarray:
    LON, LAT = np.meshgrid(lon, lat)
    inside = np.zeros(LAT.shape, dtype=bool)

    for i in range(LAT.shape[0]):
        for j in range(LAT.shape[1]):
            inside[i, j] = poly_prepared.contains(Point(float(LON[i, j]), float(LAT[i, j])))

    if not inside.any():
        cy, cx = poly_geom.centroid.y, poly_geom.centroid.x
        ilat = np.abs(lat - cy).argmin()
        ilon = np.abs(lon - cx).argmin()
        inside[ilat, ilon] = True
        print("[WARN] AOI mask empty -> using nearest cell to centroid.")
    return inside


def hourly_aoi_mean(da: xr.DataArray, mask: np.ndarray) -> xr.DataArray:
    lat = da.coords["latitude"].values
    w_lat = np.cos(np.deg2rad(lat))
    W = np.broadcast_to(w_lat[:, None], mask.shape)
    W = np.where(mask, W, 0.0)

    W_da = xr.DataArray(
        W,
        coords={"latitude": da.latitude, "longitude": da.longitude},
        dims=("latitude", "longitude"),
    )

    num = (da * W_da).sum(dim=("latitude", "longitude"), skipna=True)
    den = W_da.sum(dim=("latitude", "longitude"), skipna=True)
    return num / den


def existing_pairs_for_day(cur, aoi_id, d_local: dt.date, required_pairs: List[Tuple[str, str]]) -> set:
    if not required_pairs:
        return set()

    values_sql = ",".join(["(%s,%s)"] * len(required_pairs))
    flat = []
    for v, s in required_pairs:
        flat.extend([v, s])

    sql = CHECK_EXISTING_PAIRS_SQL_TEMPLATE.format(values_sql=values_sql)
    cur.execute(sql, (*flat, aoi_id, d_local))
    return set(cur.fetchall())


def day_is_full_in_db(pg_url: str, aoi_id, d_local: dt.date, required_pairs: List[Tuple[str, str]]) -> bool:
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            got = existing_pairs_for_day(cur, aoi_id, d_local, required_pairs)
    return len(got) == len(required_pairs)


def compute_daily_rows_for_local_day(
    raw_root: Path,
    d_local: dt.date,
    tzname: str,
    feats_spec: List[dict],
    poly_geom,
    poly_prep,
    require_success_flag: bool
) -> Optional[List[Tuple[str, str, float]]]:
    start_utc, end_utc = local_day_window_to_utc(d_local, tzname)
    utc_days = utc_dates_needed(start_utc, end_utc)

    paths = []
    for du in utc_days:
        day_dir = raw_root / f"{du:%Y/%m/%d}"
        nc = day_dir / f"era5-land_{du:%Y%m%d}.nc"

        if require_success_flag and not (day_dir / ".__SUCCESS__").exists():
            return None
        if not nc.exists():
            return None

        paths.append(nc)

    dsets = [normalize_era5_ds(open_ds(p)) for p in paths]

    try:
        ds = xr.concat(dsets, dim="time") if len(dsets) > 1 else dsets[0]

        if "time" not in ds.coords:
            tname = detect_time_coord(ds)
            if tname != "time":
                ds = ds.rename({tname: "time"})

        t_utc = pd.DatetimeIndex(ds["time"].values).tz_localize("UTC")
        sel = (t_utc >= start_utc) & (t_utc < end_utc)
        idx = np.where(sel)[0]
        if idx.size != 24:
            return None

        lat = ds["latitude"].values
        lon = ds["longitude"].values
        mask = make_aoi_mask(lat, lon, poly_prep, poly_geom)

        out = []
        for f in feats_spec:
            cds_var = f["cds_variable"]
            db_var = f["db_variable"]
            stat = f["stat"]

            if cds_var not in ds.data_vars:
                return None

            da = ds[cds_var].isel(time=idx)
            series = hourly_aoi_mean(da, mask).values

            if stat == "mean":
                val = float(np.mean(series))
            elif stat == "max":
                val = float(np.max(series))
            elif stat == "min":
                val = float(np.min(series))
            elif stat == "sum":
                val = float(np.sum(series))
            else:
                raise SystemExit(f"Unsupported stat in model spec: {stat}")

            out.append((db_var, stat, val))

        return out

    finally:
        for dsx in dsets:
            try:
                dsx.close()
            except Exception:
                pass


def table_has_source_ref(pg_url: str) -> bool:
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(HAS_SOURCE_REF_SQL)
            return cur.fetchone() is not None


# ---------------- main ----------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pg-url", required=True)
    ap.add_argument("--model-name", required=True)
    ap.add_argument("--model-version", required=True)
    ap.add_argument("--aoi-name", required=True)
    ap.add_argument(
        "--aoi-bbox",
        default=None,
        help='Optional "minLon,minLat,maxLon,maxLat"; avoids requiring aoi.geom/PostGIS.',
    )
    ap.add_argument("--tz", default="Asia/Almaty")

    # IMPORTANT: base-dir is the parent folder that contains era5land_raw/
    ap.add_argument("--base-dir", default=".")

    ap.add_argument("--require-success-flag", action="store_true")
    ap.add_argument("--skip-existing", action="store_true")

    # ✅ NEW: limit local processing range
    ap.add_argument("--start-date", default=None, help="Optional LOCAL start date YYYY-MM-DD")
    ap.add_argument("--end-date", default=None, help="Optional LOCAL end date YYYY-MM-DD")

    args = ap.parse_args()

    base = Path(args.base_dir)
    raw_root = base / "era5land_raw"
    if not raw_root.exists():
        raise SystemExit(f"Raw folder not found: {raw_root}")

    _, feats_spec, required_pairs = load_model_spec(args.pg_url, args.model_name, args.model_version)
    aoi_id, poly_geom, poly_prep = get_aoi(args.pg_url, args.aoi_name, args.aoi_bbox)

    raw_utc_dates = scan_raw_utc_dates(raw_root)
    if not raw_utc_dates:
        raise SystemExit(f"No raw files found in {raw_root}")

    local_days = build_local_days_from_raw_utc_dates(raw_utc_dates, args.tz)
    if not local_days:
        raise SystemExit("No computable local days (missing adjacent UTC files for tz conversion).")

    # ✅ NEW: restrict processing to a requested range
    if args.start_date:
        s = dt.date.fromisoformat(args.start_date)
        local_days = [d for d in local_days if d >= s]
    if args.end_date:
        e = dt.date.fromisoformat(args.end_date)
        local_days = [d for d in local_days if d <= e]

    if not local_days:
        print("Nothing to process in requested date window.")
        return

    has_src = table_has_source_ref(args.pg_url)
    upsert_sql = UPSERT_WITH_SOURCE_REF_SQL if has_src else UPSERT_NO_SOURCE_REF_SQL
    if has_src:
        print("DB: features_daily_aoi has column source_ref ✅")
    else:
        print("DB: features_daily_aoi has NO column source_ref (will insert without it) ✅")

    print(f"Found raw UTC file-days: {len(raw_utc_dates)} ({raw_utc_dates[0]} .. {raw_utc_dates[-1]})")
    print(f"Processing LOCAL days: {len(local_days)} ({local_days[0]} .. {local_days[-1]})")
    print(f"Model requires {len(required_pairs)} features per local day.")
    print(f"AOI={args.aoi_name}")
    print(f"TZ={args.tz}")
    print(f"RAW_ROOT={raw_root}")

    wrote_rows = 0
    days_skipped = 0
    days_failed = 0

    src_ref = f"ERA5-Land raw->daily AOI; tz={args.tz}"

    for d_local in local_days:
        if args.skip_existing:
            try:
                if day_is_full_in_db(args.pg_url, aoi_id, d_local, required_pairs):
                    days_skipped += 1
                    continue
            except Exception as e:
                print(f"[WARN] DB check failed for {d_local}: {e}")

        rows = compute_daily_rows_for_local_day(
            raw_root=raw_root,
            d_local=d_local,
            tzname=args.tz,
            feats_spec=feats_spec,
            poly_geom=poly_geom,
            poly_prep=poly_prep,
            require_success_flag=args.require_success_flag
        )
        if rows is None:
            days_failed += 1
            print(f"[SKIP] {d_local}: missing raw/flag or not 24 steps or var missing")
            continue

        with psycopg.connect(args.pg_url, autocommit=True) as conn:
            with conn.cursor() as cur:
                if has_src:
                    cur.executemany(
                        upsert_sql,
                        [(aoi_id, d_local, var, stat, val, src_ref) for (var, stat, val) in rows]
                    )
                else:
                    cur.executemany(
                        upsert_sql,
                        [(aoi_id, d_local, var, stat, val) for (var, stat, val) in rows]
                    )

        wrote_rows += len(rows)
        print(f"[OK] {d_local}: wrote {len(rows)}")

    print(f"\nDONE. rows_written={wrote_rows} days_skipped={days_skipped} days_failed={days_failed}")


if __name__ == "__main__":
    main()
