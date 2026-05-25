#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ensemble_median.py

Compute ensemble median forecast from multiple run folders.

Expected per-run file:
  <run_dir>/forecast_<AOI>_<YYYYMMDD>.csv

CSV format:
  target_date,lead_days,value
"""

from pathlib import Path
import numpy as np
import pandas as pd
import argparse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs-root", required=True, help="Folder containing wd_uba_lumped_run1..runN")
    ap.add_argument("--aoi-name", required=True, help="AOI name used in forecast filename (same as in run_model.py)")
    ap.add_argument("--issue-date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--out", default=None, help="Output CSV path (optional)")
    args = ap.parse_args()

    runs_root = Path(args.runs_root)
    issue_str = args.issue_date.replace("-", "")
    aoi = args.aoi_name

    # 1) collect run dirs
    run_dirs = sorted([p for p in runs_root.iterdir() if p.is_dir()])
    if not run_dirs:
        raise SystemExit(f"No run folders found in: {runs_root}")

    # 2) load per-run forecasts
    dfs = []
    used = []
    for rd in run_dirs:
        csv_path = rd / f"forecast_{aoi}_{issue_str}.csv"
        if not csv_path.exists():
            # skip if run didn't produce forecast file
            continue
        df = pd.read_csv(csv_path)
        if not {"target_date", "value"}.issubset(df.columns):
            raise SystemExit(f"Bad format in {csv_path}, need columns target_date,value")
        df = df[["target_date", "value"]].copy()
        df["target_date"] = pd.to_datetime(df["target_date"]).dt.date.astype(str)
        dfs.append(df.rename(columns={"value": rd.name}))
        used.append(rd.name)

    if not dfs:
        raise SystemExit(
            f"No forecast CSV files found. Expected something like forecast_{aoi}_{issue_str}.csv in each run folder."
        )

    print(f"[OK] Loaded {len(dfs)} runs: {used}")

    # 3) merge all runs by target_date
    merged = dfs[0]
    for d in dfs[1:]:
        merged = merged.merge(d, on="target_date", how="inner")

    if merged.shape[1] < 2:
        raise SystemExit("Nothing to ensemble after merge (no common target_date).")

    # 4) compute median across run columns
    run_cols = [c for c in merged.columns if c != "target_date"]
    values = merged[run_cols].to_numpy(dtype=float)
    med = np.nanmedian(values, axis=1)

    out = pd.DataFrame({
        "target_date": merged["target_date"],
        "lead_days": np.arange(1, len(med) + 1),
        "median_value": med.astype(float),
        "n_runs": np.sum(~np.isnan(values), axis=1).astype(int)
    })

    # 5) save output
    out_path = Path(args.out) if args.out else (runs_root / f"ensemble_median_{aoi}_{issue_str}.csv")
    out.to_csv(out_path, index=False)
    print(f"[DONE] Ensemble median saved to: {out_path}")


if __name__ == "__main__":
    main()
