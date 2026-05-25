#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
register_runs.py

Registers ensemble training runs for ONE model/version into Postgres table public.model_run.

DB table model_run columns (your schema):
  run_id (uuid, PK)
  model_id (uuid, NOT NULL)
  version (text, NOT NULL)
  issue_time (timestamptz, NOT NULL)        -- UNIQUE with (model_id, version, issue_time)
  horizon_days (int, NOT NULL)
  status (text, NOT NULL)
  created_at (timestamptz, default now())
  weights_uri (text, nullable)
  scaler_x_uri (text, nullable)
  scaler_y_uri (text, nullable)
  run_config (jsonb, nullable)

Your folder layout:
  RUNS_ROOT/
    scaler_X.pkl                         (GLOBAL scaler_X)
    wd_uba_lumped_run1/
      wd_uba_lumped_YYYYMMDD_HHMMSS/
        model_state.pt
        scaler_y.pkl                     (often per-run)
        scaler_X.pkl                     (optional per-run)
        results.json                     (optional)
    wd_uba_lumped_run2/
      ...

Logic:
- For each run folder wd_uba_lumped_run*:
    1) Find newest artifact folder containing model_state.pt (recursive)
    2) weights_uri = artifact/model_state.pt
    3) scaler_y_uri = artifact/scaler_y.pkl if exists else NULL
    4) scaler_x_uri = artifact/scaler_X.pkl if exists else RUNS_ROOT/scaler_X.pkl if exists else NULL
    5) Insert into model_run with status='done'
- Safe to re-run: uses ON CONFLICT (model_id, version, issue_time) DO UPDATE.
"""

import json
import datetime as dt
from pathlib import Path
import psycopg


# ============================================================
# 1) CONNECTION SETTINGS
# ============================================================
PG_URL = "postgresql://app_writer:flood2025@localhost:5432/hydro_forecasts"


# ============================================================
# 2) MODEL IDENTITY (must already exist via register_model.py)
# ============================================================
MODEL_NAME = "LSTM_lumped_Uba"
MODEL_VERSION = "v1.0"


# ============================================================
# 3) WHERE RUN FOLDERS LIVE (EDIT IF NEEDED)
#    You confirmed scaler_X here:
#    C:\Users\user_pc\models_ETL\models_ETL_new\uba_lumped\scaler_X.pkl
# ============================================================
RUNS_ROOT = Path(r"C:\Users\user_pc\models_ETL\models_ETL_new\uba_lumped")
RUN_DIR_GLOB = "wd_uba_lumped_run*"


# ============================================================
# 4) ARTIFACT FILENAMES
# ============================================================
WEIGHTS_FILENAME = "model_state.pt"
SCALER_X_FILENAME = "scaler_X.pkl"
SCALER_Y_FILENAME = "scaler_y.pkl"
RESULTS_JSON_FILENAME = "results.json"  # optional


# Global scaler_X fallback (if a run doesn't have its own scaler_X.pkl)
GLOBAL_SCALER_X = RUNS_ROOT / SCALER_X_FILENAME


# ============================================================
# 5) RUN METADATA STORED IN DB
# ============================================================
RUN_STATUS = "done"

# Must be unique per run because of UNIQUE(model_id, version, issue_time)
# We'll generate deterministic unique timestamps by adding seconds.
ISSUE_TIME_BASE = dt.datetime(2026, 1, 30, 0, 0, 0)


# ============================================================
# 6) SQL
# ============================================================
GET_MODEL_ID_SQL = """
select m.model_id
from models m
join model_versions v using (model_id)
where m.model_name = %s and v.version = %s
"""

GET_HORIZON_SQL = """
select (config_json->>'forecast_horizon')::int
from model_versions v
join models m using (model_id)
where m.model_name = %s and v.version = %s
"""

INSERT_RUN_SQL = """
insert into model_run (
  model_id, version, issue_time, horizon_days, status,
  weights_uri, scaler_x_uri, scaler_y_uri, run_config
)
values (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
on conflict (model_id, version, issue_time)
do update set
  status = excluded.status,
  weights_uri = excluded.weights_uri,
  scaler_x_uri = excluded.scaler_x_uri,
  scaler_y_uri = excluded.scaler_y_uri,
  run_config = excluded.run_config,
  created_at = now();
"""


# ============================================================
# Helpers
# ============================================================
def rel(p: Path) -> str:
    """Store paths relative to RUNS_ROOT (portable)."""
    return p.relative_to(RUNS_ROOT).as_posix()


def newest_artifact_dir(run_dir: Path) -> Path | None:
    """
    Find the newest artifact directory under run_dir that contains model_state.pt.
    Works well when artifact folders are timestamped like wd_uba_lumped_YYYYMMDD_HHMMSS.
    """
    candidates = []
    for w in run_dir.rglob(WEIGHTS_FILENAME):
        if w.is_file():
            candidates.append(w.parent)

    if not candidates:
        return None

    # Prefer lexicographically newest folder name (timestamped folders)
    candidates = sorted(set(candidates), key=lambda d: d.name)
    return candidates[-1]


def read_optional_results(artifact_dir: Path) -> dict:
    """Try to read results.json to extract optional metadata (seed, config, etc.)."""
    p = artifact_dir / RESULTS_JSON_FILENAME
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


# ============================================================
# MAIN
# ============================================================
def main():
    if not RUNS_ROOT.exists():
        raise SystemExit(f"RUNS_ROOT not found: {RUNS_ROOT}")

    run_dirs = sorted([p for p in RUNS_ROOT.glob(RUN_DIR_GLOB) if p.is_dir()])
    if not run_dirs:
        raise SystemExit(f"No run folders matching '{RUN_DIR_GLOB}' in {RUNS_ROOT}")

    print(f"Found {len(run_dirs)} run folders.")
    print("Connecting to DB...")

    with psycopg.connect(PG_URL, autocommit=True) as conn:
        with conn.cursor() as cur:
            # 1) Resolve model_id
            cur.execute(GET_MODEL_ID_SQL, (MODEL_NAME, MODEL_VERSION))
            row = cur.fetchone()
            if not row:
                raise SystemExit(f"Model not found: {MODEL_NAME} {MODEL_VERSION}. Run register_model.py first.")
            model_id = row[0]
            print(f"✅ model_id = {model_id}")

            # 2) Horizon days
            cur.execute(GET_HORIZON_SQL, (MODEL_NAME, MODEL_VERSION))
            r = cur.fetchone()
            horizon_days = int(r[0]) if r and r[0] is not None else 7
            print(f"✅ horizon_days = {horizon_days}")

            # 3) Global scaler_X fallback
            global_scaler_x_uri = rel(GLOBAL_SCALER_X) if GLOBAL_SCALER_X.exists() else None
            if global_scaler_x_uri:
                print(f"ℹ️ Global scaler_X fallback: {global_scaler_x_uri}")
            else:
                print("⚠️ Global scaler_X.pkl not found in RUNS_ROOT (ok only if each artifact has its own scaler_X.pkl).")

            ok = 0
            skipped = 0

            # 4) Insert each run
            for i, run_dir in enumerate(run_dirs, start=1):
                run_name = run_dir.name

                artifact_dir = newest_artifact_dir(run_dir)
                if artifact_dir is None:
                    print(f"[SKIP] {run_name}: cannot find {WEIGHTS_FILENAME} anywhere inside.")
                    skipped += 1
                    continue

                weights_path = artifact_dir / WEIGHTS_FILENAME
                if not weights_path.exists():
                    print(f"[SKIP] {run_name}: artifact dir found but missing weights.")
                    skipped += 1
                    continue

                # scalers: prefer artifact dir, fallback for scaler_X to global
                scaler_y_path = artifact_dir / SCALER_Y_FILENAME
                scaler_x_path = artifact_dir / SCALER_X_FILENAME

                scaler_y_uri = rel(scaler_y_path) if scaler_y_path.exists() else None
                scaler_x_uri = rel(scaler_x_path) if scaler_x_path.exists() else global_scaler_x_uri

                if scaler_x_uri is None:
                    print(f"[WARN] {run_name}: scaler_X not found in artifact AND no global scaler_X.pkl")
                if scaler_y_uri is None:
                    print(f"[WARN] {run_name}: scaler_y.pkl not found in artifact folder: {rel(artifact_dir)}")

                # Unique issue_time per run (required by UNIQUE constraint)
                issue_time = ISSUE_TIME_BASE + dt.timedelta(seconds=i)

                # Optional metadata
                res = read_optional_results(artifact_dir)
                seed = res.get("seed") or res.get("config", {}).get("seed")

                run_cfg = {
                    "run_name": run_name,
                    "artifact_dir": rel(artifact_dir),
                    "seed": seed,
                    "ensemble_member": True,
                }

                # Insert / upsert
                cur.execute(
                    INSERT_RUN_SQL,
                    (
                        model_id,
                        MODEL_VERSION,
                        issue_time,
                        horizon_days,
                        RUN_STATUS,
                        rel(weights_path),
                        scaler_x_uri,
                        scaler_y_uri,
                        json.dumps(run_cfg),
                    )
                )

                print(f"[OK] {run_name} -> {rel(artifact_dir)}")
                ok += 1

            print(f"DONE. Registered/updated: {ok}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
