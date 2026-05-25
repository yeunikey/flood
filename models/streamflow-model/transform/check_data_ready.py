#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
check_data_ready.py

Checks whether ALL required daily features for a model
are present in features_daily_aoi
for lookback window before issue_date.

Example:
  python check_data_ready.py ^
    --pg-url "postgresql://app_writer:PASS@localhost:5432/hydro_forecasts" ^
    --model-name "LSTM_lumped_Uba" --model-version "v1.0" ^
    --aoi-name "Uba_basin" ^
    --issue-date 2025-09-02 ^
    --lookback-days 30
"""

import argparse
import datetime as dt
import psycopg


# ---------------- SQL ----------------

GET_AOI_ID_SQL = "select aoi_id from aoi where aoi_name=%s"

GET_MODEL_CFG_SQL = """
select v.config_json
from model_versions v
join models m using (model_id)
where m.model_name=%s and v.version=%s
"""

FETCH_EXISTING_SQL = """
select date, variable, stat
from features_daily_aoi
where aoi_id = %s
  and date between %s and %s
"""


# ---------------- helpers ----------------

def load_required_pairs(pg_url, model_name, model_version):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_MODEL_CFG_SQL, (model_name, model_version))
            row = cur.fetchone()

    if not row:
        raise SystemExit(f"Model config not found: {model_name} {model_version}")

    cfg = row[0]
    feats = cfg["features"]["dynamic"]
    return [(f["db_variable"], f["stat"]) for f in feats]


def get_aoi_id(pg_url, aoi_name):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_AOI_ID_SQL, (aoi_name,))
            row = cur.fetchone()

    if not row:
        raise SystemExit(f"AOI not found: {aoi_name}")
    return row[0]


# ---------------- main ----------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pg-url", required=True)
    ap.add_argument("--model-name", required=True)
    ap.add_argument("--model-version", required=True)
    ap.add_argument("--aoi-name", required=True)
    ap.add_argument("--issue-date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--lookback-days", type=int, default=30)

    args = ap.parse_args()

    issue_date = dt.datetime.strptime(args.issue_date, "%Y-%m-%d").date()
    start_date = issue_date - dt.timedelta(days=args.lookback_days)

    print("========================================")
    print("CHECK DATA READY")
    print("========================================")
    print(f"Model     : {args.model_name} {args.model_version}")
    print(f"AOI       : {args.aoi_name}")
    print(f"Issue date: {issue_date}")
    print(f"Lookback  : {args.lookback_days} days")
    print(f"Window    : {start_date} .. {issue_date - dt.timedelta(days=1)}")
    print("----------------------------------------")

    required_pairs = load_required_pairs(
        args.pg_url, args.model_name, args.model_version
    )
    aoi_id = get_aoi_id(args.pg_url, args.aoi_name)

    with psycopg.connect(args.pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                FETCH_EXISTING_SQL,
                (aoi_id, start_date, issue_date - dt.timedelta(days=1))
            )
            rows = cur.fetchall()

    # organize existing
    existing = {}
    for d, var, stat in rows:
        existing.setdefault(d, set()).add((var, stat))

    missing_any = False

    for i in range(args.lookback_days):
        d = start_date + dt.timedelta(days=i)
        have = existing.get(d, set())
        missing = [p for p in required_pairs if p not in have]

        if missing:
            missing_any = True
            print(f"[MISSING] {d}:")
            for var, stat in missing:
                print(f"   - {var} ({stat})")

    print("----------------------------------------")
    if missing_any:
        print("❌ DATA NOT READY → inference MUST NOT RUN")
        raise SystemExit(2)
    else:
        print("✅ DATA READY → safe to run inference")
        print("========================================")


if __name__ == "__main__":
    main()
