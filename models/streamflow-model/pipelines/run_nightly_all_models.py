#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
run_nightly_all_models.py

Nightly pipeline:
1) For ALL models in DB -> resolve AOI + timezone
2) Compute date window (LOCAL): [end - (n_days-1) .. end]
   where end = today_local - lag_days
3) Download raw ERA5-Land for each model AOI into:
   ingest/model_raw_data/<MODEL_NAME>/era5land_raw/YYYY/MM/DD/era5-land_YYYYMMDD.nc
4) Repair raw files (ZIP/GRIB/HTML) in that model's raw cache
5) ETL raw -> daily AOI features into Postgres (only the date window)
6) Optional: run check_data_ready.py

Usage:
  python pipelines/run_nightly_all_models.py --pg-url "postgresql://..." --base-dir "."

Common env vars (optional):
  PG_URL, BASE_DIR, TZ_DEFAULT, ERA5_LAG_DAYS, ERA5_N_DAYS, DRY_RUN, ONLY_MODELS
"""

import os
import sys
import json
import shlex
import subprocess
import datetime as dt
from pathlib import Path
from typing import List, Tuple, Optional

import psycopg
from zoneinfo import ZoneInfo


# ---------------- DB queries ----------------

# List all model versions with config (you can filter in code)
GET_ALL_MODEL_VERSIONS = """
select m.model_name, v.version, v.config_json
from model_versions v
join models m using (model_id)
order by m.model_name, v.version
"""

# Map model -> aoi (requires your mapping table)
# If your mapping table differs, tell me and I’ll adapt query.
GET_MODEL_AOI = """
select a.aoi_name
from model_aoi ma
join models m on m.model_id = ma.model_id
join aoi a on a.aoi_id = ma.aoi_id
where m.model_name = %s
limit 1

"""


# ---------------- helpers ----------------

def parse_cfg(cfg):
    if isinstance(cfg, dict):
        return cfg
    if isinstance(cfg, (str, bytes)):
        return json.loads(cfg)
    try:
        return dict(cfg)
    except Exception as e:
        raise TypeError(f"Unsupported cfg type: {type(cfg)}") from e


def run_cmd(cmd: List[str], dry_run: bool = False) -> int:
    printable = " ".join(shlex.quote(x) for x in cmd)
    print(f"\n[CMD] {printable}")
    if dry_run:
        return 0
    p = subprocess.run(cmd, stdout=sys.stdout, stderr=sys.stderr)
    return p.returncode


def today_local(tzname: str) -> dt.date:
    tz = ZoneInfo(tzname)
    return dt.datetime.now(tz).date()


def compute_window(tzname: str, lag_days: int, n_days: int) -> Tuple[dt.date, dt.date]:
    """
    end = today_local - lag_days
    start = end - (n_days-1)
    """
    end = today_local(tzname) - dt.timedelta(days=lag_days)
    start = end - dt.timedelta(days=max(1, n_days) - 1)
    return start, end


def load_models(pg_url: str) -> List[Tuple[str, str, dict]]:
    """
    Returns list of (model_name, version, cfg_dict)
    """
    out = []
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_ALL_MODEL_VERSIONS)
            rows = cur.fetchall()

    for model_name, version, cfg_raw in rows:
        if cfg_raw is None:
            continue
        cfg = parse_cfg(cfg_raw)
        out.append((model_name, version, cfg))
    return out


def resolve_model_aoi_and_tz(pg_url: str, model_name: str, tz_default: str) -> Tuple[str, str]:
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_MODEL_AOI, (model_name,))

            row = cur.fetchone()
    if not row:
        raise RuntimeError(
            f"AOI mapping not found for model '{model_name}'. "
            f"Expected table model_aoi(model_id,aoi_id)."
        )
    aoi_name = row[0]
    tz = tz_default
    return aoi_name, tz



def extract_seq_len(cfg: dict) -> int:
    seq = cfg.get("sequence_length")
    if not isinstance(seq, int) or seq <= 0:
        raise RuntimeError("config_json.sequence_length missing/invalid.")
    return seq


# ---------------- main ----------------

def main():
    pg_url = os.getenv("PG_URL")
    base_dir = os.getenv("BASE_DIR", ".")
    tz_default = os.getenv("TZ_DEFAULT", "Asia/Almaty")

    lag_days = int(os.getenv("ERA5_LAG_DAYS", "5"))      # safe for CDS latency
    n_days = int(os.getenv("ERA5_N_DAYS", "10"))         # nightly window length

    dry_run = os.getenv("DRY_RUN", "").strip() == "1"
    only_models_env = os.getenv("ONLY_MODELS", "").strip()
    only_models = [x.strip() for x in only_models_env.split(",") if x.strip()] if only_models_env else None

    # allow CLI override for pg-url and base-dir
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--pg-url", default=pg_url, required=(pg_url is None))
    ap.add_argument("--base-dir", default=base_dir)
    ap.add_argument("--lag-days", type=int, default=lag_days)
    ap.add_argument("--n-days", type=int, default=n_days)
    ap.add_argument("--tz-default", default=tz_default)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-check", action="store_true")
    args = ap.parse_args()

    pg_url = args.pg_url
    base_dir = Path(args.base_dir).resolve()
    lag_days = args.lag_days
    n_days = args.n_days
    tz_default = args.tz_default
    dry_run = dry_run or args.dry_run

    # scripts locations (your structure)
    project_root = base_dir
    py_download = project_root / "ingest" / "download_era5_raw.py"
    py_etl = project_root / "transform" / "etl_era5_raw_to_features_db.py"
    py_repair = project_root / "ingest" / "repair_era5_raw.py"
    py_check = project_root / "transform" / "check_data_ready.py"

    for p in [py_download, py_etl, py_repair]:
        if not p.exists():
            raise SystemExit(f"Missing script: {p}")

    print("==================================================")
    print("Nightly pipeline")
    print("PG_URL:", pg_url)
    print("BASE:", project_root)
    print("TZ_DEFAULT:", tz_default)
    print("LAG_DAYS:", lag_days, "N_DAYS:", n_days)
    print("DRY_RUN:", dry_run)
    if only_models:
        print("ONLY_MODELS:", only_models)
    print("==================================================")

    models = load_models(pg_url)
    if only_models:
        models = [m for m in models if m[0] in set(only_models)]

    if not models:
        print("No models found to process.")
        return

    ok = 0
    failed = 0

    for model_name, version, cfg in models:
        print("\n" + "=" * 60)
        print(f"[MODEL] {model_name}  version={version}")

        try:
            aoi_name, tz = resolve_model_aoi_and_tz(pg_url, model_name, tz_default)
            seq_len = extract_seq_len(cfg)

            # window to ETL (small nightly window)
            start, end = compute_window(tz, lag_days, n_days)

            # For DOWNLOAD we want to cover ETL input need too.
            # But your download script can use --start/--end directly (it will fetch needed UTC days).
            # We'll download from (start - (seq_len-1)) .. end to ensure ETL has enough for models if needed later.
            dl_start = start - dt.timedelta(days=seq_len - 1)
            dl_end = end

            model_base = project_root / "ingest" / "model_raw_data" / model_name
            raw_root = model_base / "era5land_raw"

            print(f"[AOI] {aoi_name}  TZ={tz}")
            print(f"[WINDOW] ETL local: {start} .. {end}  (n_days={n_days})")
            print(f"[WINDOW] DL  local: {dl_start} .. {dl_end}  (seq_len={seq_len})")
            print(f"[PATH] model_base={model_base}")
            print(f"[PATH] raw_root={raw_root}")

            # 1) DOWNLOAD (model vars + bbox from AOI in DB)
            cmd_dl = [
                sys.executable, str(py_download),
                "--pg-url", pg_url,
                "--model-name", model_name,
                "--model-version", version,
                "--aoi-name", aoi_name,
                "--tz", tz,
                "--start", str(dl_start),
                "--end", str(dl_end),
                "--base-dir", str(project_root),
                "--out-subdir", "ingest/model_raw_data/{}/era5land_raw".format(model_name),
                # If your download script uses --model-raw-dir instead of out-subdir,
                # replace the two args above with:
                # "--model-raw-dir", str(raw_root),
            ]

            rc = run_cmd(cmd_dl, dry_run=dry_run)
            if rc != 0:
                raise RuntimeError(f"Download failed rc={rc}")

            # 2) REPAIR raw files (if needed)
            cmd_repair = [
                sys.executable, str(py_repair),
                "--root", str(raw_root),
            ]
            rc = run_cmd(cmd_repair, dry_run=dry_run)
            if rc != 0:
                raise RuntimeError(f"Repair failed rc={rc}")

            # 3) ETL only [start..end]
            cmd_etl = [
                sys.executable, str(py_etl),
                "--pg-url", pg_url,
                "--model-name", model_name,
                "--model-version", version,
                "--aoi-name", aoi_name,
                "--tz", tz,
                "--base-dir", str(model_base),  # IMPORTANT: parent containing era5land_raw/
                "--require-success-flag",
                "--skip-existing",
                "--start-date", str(start),
                "--end-date", str(end),
            ]
            rc = run_cmd(cmd_etl, dry_run=dry_run)
            if rc != 0:
                raise RuntimeError(f"ETL failed rc={rc}")

            # 4) OPTIONAL: check data ready
            if (not args.skip_check) and py_check.exists():
                cmd_check = [
                    sys.executable, str(py_check),
                    "--pg-url", pg_url,
                    "--aoi-name", aoi_name,
                    "--start-date", str(start),
                    "--end-date", str(end),
                ]
                run_cmd(cmd_check, dry_run=dry_run)

            ok += 1
            print(f"[OK] {model_name} finished.")

        except Exception as e:
            failed += 1
            print(f"[FAIL] {model_name}: {e}")

    print("\n==================================================")
    print(f"DONE: ok={ok} failed={failed} total={ok+failed}")
    print("==================================================")


if __name__ == "__main__":
    main()
