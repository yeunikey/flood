#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
prepare_features_for_issue.py

Checks whether all required features for a model are present in DB
for inference on a given issue_date.

NO MODEL RUN.
NO ERA5 DOWNLOAD (yet).
Only validation.

Later:
- this script will trigger ERA5 download + ETL if data is missing
"""

import argparse
import datetime as dt
import psycopg
import pandas as pd


# ------------------------------------------------------------
# SQL
# ------------------------------------------------------------
GET_MODEL_CFG_SQL = """
select m.model_id, v.config_json
from models m
join model_versions v using (model_id)
where m.model_name=%s and v.version=%s
"""

GET_AOI_ID_SQL = """
select aoi_id from aoi where aoi_name=%s
"""

FETCH_FEATURES_SQL = """
select date, variable, stat
from features_daily_aoi
where aoi_id=%s
  and date between %s and %s
order by date asc;
"""


# ------------------------------------------------------------
def parse_date(s):
    return dt.date.fromisoformat(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pg-url", required=True)
    ap.add_argument("--model-name", required=True)
    ap.add_argument("--model-version", required=True)
    ap.add_argument("--aoi-name", required=True)
    ap.add_argument("--issue-date", required=True, help="YYYY-MM-DD")
    args = ap.parse_args()

    issue_date = parse_date(args.issue_date)

    # --------------------------------------------------------
    # Load model config
    # --------------------------------------------------------
    with psycopg.connect(args.pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_MODEL_CFG_SQL, (args.model_name, args.model_version))
            row = cur.fetchone()
            if not row:
                raise SystemExit("Model/version not found")

            model_id, cfg = row
            seq_len = int(cfg["sequence_length"])

            dyn_feats = cfg["features"]["dynamic"]
            required_pairs = [(f["db_variable"], f["stat"]) for f in dyn_feats]

            cur.execute(GET_AOI_ID_SQL, (args.aoi_name,))
            r = cur.fetchone()
            if not r:
                raise SystemExit("AOI not found")
            aoi_id = r[0]

    start_date = issue_date - dt.timedelta(days=seq_len - 1)

    # --------------------------------------------------------
    # Fetch existing features
    # --------------------------------------------------------
    with psycopg.connect(args.pg_url) as conn:
        df = pd.read_sql(
            FETCH_FEATURES_SQL,
            conn,
            params=(aoi_id, start_date, issue_date),
        )

    print(f"Checking features for AOI={args.aoi_name}")
    print(f"Period: {start_date} → {issue_date}")
    print(f"Required days: {seq_len}")
    print()

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------
    missing = []

    for d in pd.date_range(start_date, issue_date):
        d = d.date()
        for var, stat in required_pairs:
            mask = (
                (df["date"] == d) &
                (df["variable"] == var) &
                (df["stat"] == stat)
            )
            if not mask.any():
                missing.append((d, var, stat))

    if missing:
        print("❌ MISSING FEATURES:")
        for d, v, s in missing:
            print(f"  {d} | {v} | {s}")
        print()
        print("➡️  RESULT: DATA NOT READY FOR INFERENCE")
        exit(1)

    print("✅ ALL REQUIRED FEATURES ARE PRESENT")
    print("➡️  RESULT: READY FOR MODEL INFERENCE")


if __name__ == "__main__":
    main()
