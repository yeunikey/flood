#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
forecast/inference_lstm_lumped.py

Single-issue-date inference for an LSTM streamflow model over a LUMPED AOI.

This script generates a fixed-horizon forecast (H days) for one `issue_date`.
It pulls the last `sequence_length` days of features from Postgres, applies the
saved scalers + LSTM weights, produces predictions, writes a CSV, and optionally
upserts results into the database.

Forecast definition
-------------------
- `issue_date` is the first forecast day (lead_day = 1).
- The script always outputs the FULL horizon:
    lead_day = 1..H
    forecast_date = issue_date + (lead_day - 1)

Input window (features)
-----------------------
- Input features cover the `sequence_length` days immediately before issue_date:
    [issue_date - sequence_length, ..., issue_date - 1]
- Features are read from `features_daily_aoi`, mapped/renamed using config,
  pivoted to wide daily form, and reindexed to a continuous daily range.

Hard blocking rules (must pass)
-------------------------------
1) Lag gate:
   Forecast is allowed only if:
      end_date <= realtime_date - min_lag_days
   where:
      end_date = issue_date + (H - 1)

2) Seasonal constraint (valid_period):
   The entire INPUT window must be within Nov..May only.

3) Hydrological-year constraint:
   The entire INPUT window must belong to ONE hydrological year, defined as:
      HY = year + 1  if month >= 11
      HY = year      otherwise

If any rule fails, inference is rejected and the script stops (no CSV/DB output).

Model artifacts / runs
----------------------
- Model config is loaded from `model_versions.config_json`.
- A model run is selected from `model_run` by status:
    primary = --run-status
    fallback = --fallback-status
- Artifacts (weights + scalers) are loaded from files under --model-store.

Note: If multiple matching runs exist, predictions are aggregated by median
(ensemble_method='median'). In your typical setup there is only one run.

Database writes (optional)
--------------------------
When DB writes are enabled (default):
- Upserts one `forecast_run` row (unique by model_id, model_version, aoi_id, issue_date)
- Upserts H rows into `forecast_daily_aoi` (unique by run_id, forecast_date, variable)

CSV output
----------
Always writes a CSV for the full horizon with columns:
  issue_date, forecast_date, lead_day, forecast, n_runs

CLI arguments
-------------
Required:
  --pg-url            Postgres connection string.
  --model-name        Name in `models.model_name`.
  --model-version     Version string in `model_versions.version`.
  --aoi-name          AOI name in `aoi.aoi_name`.
  --issue-date        YYYY-MM-DD. First forecast day (lead_day=1).
  --model-store       Base directory where artifacts referenced by DB URIs exist.

Optional:
  --run-status        Preferred model_run.status to use (default: "active").
  --fallback-status   Backup model_run.status if none match run-status (default: "done").
  --device            "cpu" or "cuda" (default: "cpu"). If cuda requested but unavailable -> cpu.
  --out-dir           Output directory for CSV (default: ".").
  --forecast-variable Name stored in forecast_daily_aoi.variable (default: "streamflow").
  --no-db-write       If set, skip DB writes (CSV only).

Lag gate options:
  --realtime-date     YYYY-MM-DD. Defaults to today if omitted. Used in lag gate.
  --min-lag-days      Minimum lag in days (default: 30). Requires:
                        issue_date + (H - 1) <= realtime_date - min_lag_days

Exit codes / failure cases
--------------------------
Typical reasons the script stops:
- Missing AOI, model, or model version in DB
- No features available for the input window
- Missing required feature columns after pivot
- NaNs in the input window
- No model_run found with --run-status and --fallback-status
- Lag gate violation (too close to realtime)
- Seasonal/hydro-year constraint violation (input window outside Nov..May or crosses HY)

Usage examples
--------------
1) Basic run (CPU), writes CSV + DB:
   python forecast/inference_lstm_lumped.py ^
     --pg-url "postgresql://app_writer:***@localhost:5432/hydro_forecasts" ^
     --model-name "LSTM_lumped_Uba" ^
     --model-version "v1.0" ^
     --aoi-name "Uba_basin" ^
     --issue-date 2025-02-02 ^
     --model-store "C:\\path\\to\\models\\uba_lumped" ^
     --out-dir ".\\outputs" ^
     --run-status done ^
     --fallback-status done

2) CSV only (no DB write):
   python forecast/inference_lstm_lumped.py ^
     --pg-url "postgresql://app_writer:***@localhost:5432/hydro_forecasts" ^
     --model-name "LSTM_lumped_Uba" ^
     --model-version "v1.0" ^
     --aoi-name "Uba_basin" ^
     --issue-date 2025-02-02 ^
     --model-store "C:\\path\\to\\models\\uba_lumped" ^
     --out-dir ".\\outputs" ^
     --no-db-write

3) Enforce lag gate against a fixed realtime date:
   python forecast/inference_lstm_lumped.py ^
     --pg-url "postgresql://app_writer:***@localhost:5432/hydro_forecasts" ^
     --model-name "LSTM_lumped_Uba" ^
     --model-version "v1.0" ^
     --aoi-name "Uba_basin" ^
     --issue-date 2025-02-02 ^
     --model-store "C:\\path\\to\\models\\uba_lumped" ^
     --realtime-date 2025-03-15 ^
     --min-lag-days 30

"""

import argparse
import datetime as dt
from pathlib import Path
import pickle
import json
import uuid

import numpy as np
import pandas as pd
import psycopg
import torch
import torch.nn as nn

from utils.unit_convert import mm_day_to_discharge_m3s, round3
import uuid

# ============================================================
# MODEL (UNCHANGED)
# ============================================================

class LSTMWaterDischarge(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, horizon=1, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.fc = nn.Linear(hidden_size, horizon)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_output = lstm_out[:, -1, :]
        return self.fc(last_output)

# ============================================================
# SQL
# ============================================================

GET_AOI = "select aoi_id from aoi where aoi_name=%s"

GET_MODEL = """
select m.model_id, v.config_json
from models m
join model_versions v using(model_id)
where m.model_name=%s and v.version=%s
"""

GET_RUNS_BY_STATUS = """
select run_id, weights_uri, scaler_x_uri, scaler_y_uri, status, issue_time
from model_run
where model_id=%s and version=%s and status=%s
order by issue_time
"""

GET_RUNS_LATEST_ANY = """
select run_id, weights_uri, scaler_x_uri, scaler_y_uri, status, issue_time
from model_run
where model_id=%s and version=%s
order by issue_time desc
limit 10
"""

GET_FEATURES = """
select date, variable, stat, value
from features_daily_aoi
where aoi_id=%s and date between %s and %s
"""

GET_AOI_AREA = """
select area_m2
from aoi_attributes
where aoi_id=%s
"""

# Writes
INSERT_FORECAST_RUN = """
insert into forecast_run (
    run_id,
    model_id,
    model_version,
    aoi_id,
    issue_date,
    horizon_days,
    ensemble_method,
    status
)
values (%s,%s,%s,%s,%s,%s,%s,%s)
on conflict (model_id, model_version, aoi_id, issue_date)
do update set
    horizon_days=excluded.horizon_days,
    ensemble_method=excluded.ensemble_method,
    status=excluded.status,
    created_at=now()
returning run_id
"""

INSERT_FORECAST_DAILY = """
insert into forecast_daily_aoi (
    forecast_id,
    run_id,
    forecast_date,
    lead_day,
    variable,
    value
)
values (%s,%s,%s,%s,%s,%s)
on conflict (run_id, forecast_date, variable)
do update set
    value=excluded.value,
    created_at=now()
"""

# ============================================================
# UTILS
# ============================================================
def load_pickle(p: Path):
    with open(p, "rb") as f:
        return pickle.load(f)

def parse_cfg(cfg):
    """cfg can arrive as dict (psycopg json) or as string; normalize to dict."""
    if isinstance(cfg, dict):
        return cfg
    if isinstance(cfg, (str, bytes)):
        return json.loads(cfg)

    try:
        return dict(cfg)

    except Exception as e:
        raise TypeError(f"Unsupported cfg type: {type(cfg)}") from e

def parse_date(s: str) -> dt.date:
    return dt.datetime.strptime(s, "%Y-%m-%d").date()

def resolve_artifact(model_store: Path, uri: str) -> Path:
    """
    Resolve DB URI (relative path) into a real file path under model_store.
    Supports DB strings containing either / or \\.
    """
    if uri is None:
        raise ValueError("Artifact URI is None")

    uri_norm = str(uri).strip().strip('"').strip("'").replace("\\", "/")

    p = (model_store / uri_norm).resolve()

    if not p.exists():
        raise FileNotFoundError(f"Artifact not found: {p}\n  (model_store={model_store}, uri={uri})")
    return p

def pick_device(requested: str) -> torch.device:
    """If user asked cuda but it's not available -> fallback to cpu."""
    req = (requested or "cpu").lower()
    if req.startswith("cuda"):
        if torch.cuda.is_available():
            return torch.device("cuda")
        print("⚠️ CUDA requested but not available. Falling back to CPU.")
        return torch.device("cpu")
    return torch.device("cpu")

def lag_gate(req_end: dt.date, realtime: dt.date, min_lag_days: int):
    cutoff = realtime - dt.timedelta(days=int(min_lag_days))
    if req_end > cutoff:
        raise ValueError(
            f"Request blocked by lag rule: end-date ({req_end}) must be <= cutoff ({cutoff}) "
            f"where cutoff = realtime_date ({realtime}) - {min_lag_days} days."
        )

def get_hydro_year(d: pd.Timestamp) -> int:
    # same as in your Dataset class
    return d.year + 1 if d.month >= 11 else d.year


def enforce_hydro_year_window(idx: pd.DatetimeIndex, issue_date: dt.date):
    """
    Ensures the whole input window belongs to ONE hydrological year.
    Minimal version: check first + last (same as your dataset idea).
    """
    if len(idx) == 0:
        raise RuntimeError("Empty date index for hydro-year check")

    first_hy = get_hydro_year(idx[0])
    last_hy = get_hydro_year(idx[-1])

    if first_hy != last_hy:
        raise RuntimeError(
            f"Hydrological-year filter failed for issue_date={issue_date}: "
            f"window crosses hydro year ({idx[0].date()} -> HY{first_hy}, {idx[-1].date()} -> HY{last_hy})."
        )


def valid_period(d: pd.Timestamp) -> bool:
    # same as in your Dataset: allow only Nov..May
    return d.month >= 11 or (1 <= d.month <= 5)


def enforce_valid_period(idx: pd.DatetimeIndex, issue_date: dt.date):
    if len(idx) == 0:
        raise RuntimeError("Empty date index for valid_period check")

    bad = [ts.date() for ts in idx if not valid_period(ts)]
    if bad:
        print(
            f"Forecast not allowed (issue_date={issue_date}): "
            "model is allowed only for Nov–May. "
            f"Example bad dates: {bad[:5]}"
        )
        raise RuntimeError(
            f"valid_period filter failed for issue_date={issue_date}. "
            f"Window contains months outside Nov..May. Example bad dates: {bad[:5]}"
        )



# ============================================================

# CORE: One issue_date inference (returns full horizon + dates)

# ============================================================

def infer_one_issue_date(
    *,
    pg_url: str,
    model_id: int,
    model_version: str,
    aoi_id: int,
    aoi_name: str,
    cfg: dict,
    model_store: Path,
    issue_date: dt.date,
    device: torch.device,
    run_status: str,
    fallback_status: str,
) -> dict:
    """
    Run inference for one issue_date.
    Returns dict with:
      - issue_date, horizon, full_dates(list[date]), ens(np.ndarray), n_runs(int)
    """
    seq_len = int(cfg["sequence_length"])
    horizon = int(cfg["forecast_horizon"])
    feature_order = list(cfg["feature_order"])
    hparams = cfg["train_hparams"]

    # Input window ends at issue_date-1
    start = issue_date - dt.timedelta(days=seq_len)
    end = issue_date - dt.timedelta(days=1)
    
    # -------- DB: Features window --------
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_FEATURES, (aoi_id, start, end))
            rows = cur.fetchall()

    if not rows:
        raise RuntimeError(f"No features returned for AOI={aoi_name} in [{start} .. {end}]")

    df = pd.DataFrame(rows, columns=["date", "variable", "stat", "value"])

    df["date"] = pd.to_datetime(df["date"])
    df["grid_name"] = "lumped"  # REQUIRED

    dyn = cfg["features"]["dynamic"]

    mapper = {(f["db_variable"], f["stat"]): f["rename_as"] for f in dyn}

    df["feat"] = df.apply(lambda r: mapper.get((r.variable, r.stat)), axis=1)

    df = df.dropna(subset=["feat"])


    wide = df.pivot(index="date", columns="feat", values="value").sort_index()

    wide = wide.reindex(pd.date_range(start, end, freq="D"))

    # ✅ NEW: hydro year filter (same as dataset logic)
    enforce_hydro_year_window(wide.index, issue_date)
    # (optional if you also keep hydro-year filter)
    enforce_valid_period(wide.index, issue_date)

    missing_cols = [c for c in feature_order if c not in wide.columns]

    if missing_cols:
        raise RuntimeError(f"Missing required features in pivot: {missing_cols}")

    if wide.isna().any().any():
        bad = wide.isna().sum()
        bad = bad[bad > 0].sort_values(ascending=False)
        raise RuntimeError(f"NaNs in input window for issue_date={issue_date}. Top missing counts:\n{bad.head(10)}")

    # -------- DB: Runs (status-aware) --------

    fallback_status = (fallback_status or "").strip()

    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_RUNS_BY_STATUS, (model_id, model_version, run_status))
            runs = cur.fetchall()
            if not runs and fallback_status:
                print(f"⚠️ No runs with status='{run_status}'. Trying fallback_status='{fallback_status}'...")
                cur.execute(GET_RUNS_BY_STATUS, (model_id, model_version, fallback_status))
                runs = cur.fetchall()

            if not runs:
                cur.execute(GET_RUNS_LATEST_ANY, (model_id, model_version))
                latest = cur.fetchall()
                msg = (f"No runs found for model_id={model_id}, version={model_version} "
                       f"with status='{run_status}'")
                if fallback_status:
                    msg += f" or fallback_status='{fallback_status}'"

                if latest:
                    msg += "\nLatest runs (run_id, status, issue_time):\n" + "\n".join(
                        [f"  {r[0]}  {r[4]}  {r[5]}" for r in latest]
                    )
                raise RuntimeError(msg)

    # -------- Inference over runs --------
    preds = []

    for run_id, w_uri, sx_uri, sy_uri, st, issue_time in runs:

        w_path = resolve_artifact(model_store, w_uri)
        sx_path = resolve_artifact(model_store, sx_uri)
        sy_path = resolve_artifact(model_store, sy_uri)

        scaler_X = load_pickle(sx_path)
        scaler_y = load_pickle(sy_path)

        X_df = wide.reindex(columns=feature_order)
        X_scaled = scaler_X.transform(X_df)
        X = torch.from_numpy(X_scaled.astype(np.float32)).unsqueeze(0).to(device)

        model = LSTMWaterDischarge(
            input_size=len(feature_order),
            hidden_size=hparams["hidden_size"],
            num_layers=hparams["num_layers"],
            horizon=horizon,
            dropout=hparams["dropout"],
        ).to(device)

        try:
            state = torch.load(w_path, map_location=device, weights_only=True)

        except TypeError:
            state = torch.load(w_path, map_location=device)

        model.load_state_dict(state)

        model.eval()

        with torch.no_grad():
            y = model(X).detach().cpu().numpy().reshape(-1)

        y = scaler_y.inverse_transform(y.reshape(-1, 1)).reshape(-1)
        preds.append(np.maximum(y, 0.0))


    preds = np.stack(preds)  # (n_runs, horizon)
    ens = np.median(preds, axis=0)


    full_dates = [issue_date + dt.timedelta(days=i) for i in range(horizon)]

    return {
        "issue_date": issue_date,
        "horizon": horizon,
        "full_dates": full_dates,
        "ens": ens,
        "n_runs": int(preds.shape[0]),
    }

def write_run_to_db(
    *,
    pg_url: str,
    model_id: int,
    model_version: str,
    aoi_id: int,
    issue_date: dt.date,
    horizon: int,
    full_dates: list,
    ens: np.ndarray,
    forecast_variable: str,
    ensemble_method: str = "median",
    run_status: str = "done",
):
    """Upsert forecast_run + write full horizon into forecast_daily_aoi."""
    run_uuid = uuid.uuid4()

    with psycopg.connect(pg_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                INSERT_FORECAST_RUN,
                (
                   run_uuid,
                    model_id,
                    model_version,
                    aoi_id,
                    issue_date,
                    horizon,
                    ensemble_method,
                    run_status,
                ),
            )

            db_run_id = cur.fetchone()[0]


            rows_daily = []
            for i in range(horizon):
                rows_daily.append(
                    (
                        uuid.uuid4(),          # forecast_id
                        db_run_id,             # run_id
                        full_dates[i],         # forecast_date
                        i + 1,                 # lead_day
                        forecast_variable,     # variable
                        float(ens[i]),         # value
                    )
                )
            cur.executemany(INSERT_FORECAST_DAILY, rows_daily)

    print("✅ Written to DB:")
    print("   forecast_run.run_id =", db_run_id)
    print(f"   forecast_daily_aoi rows = {horizon} (variable='{forecast_variable}')")
    return db_run_id


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pg-url", required=True)
    ap.add_argument("--model-name", required=True)
    ap.add_argument("--model-version", required=True)
    ap.add_argument("--aoi-name", required=True)

    ap.add_argument("--issue-date", required=True, help="YYYY-MM-DD. lead_day=1 corresponds to issue-date.")

    ap.add_argument("--model-store", required=True, help="Base directory containing artifacts referenced by DB URIs.")
    ap.add_argument("--run-status", default="active")
    ap.add_argument("--fallback-status", default="done")

    ap.add_argument("--device", default="cpu")
    ap.add_argument("--out-dir", default=".")

    ap.add_argument("--forecast-variable", default="streamflow",
                    help="Variable name stored in forecast_daily_aoi.variable (default: streamflow).")

    ap.add_argument("--no-db-write", action="store_true",
                    help="If set, do NOT write forecasts to DB (CSV only).")

    # ---- NEW: lag rule ----
    ap.add_argument("--realtime-date", default=None,
                    help="YYYY-MM-DD (defaults to today). Used for lag gate.")
    ap.add_argument("--min-lag-days", type=int, default=30,
                    help="Require end-date to be at least this many days before realtime-date (default: 30).")


    args = ap.parse_args()

    print("CUDA available:", torch.cuda.is_available())
    device = pick_device(args.device)
    print("Using device:", device)

    issue_date = parse_date(args.issue_date)

    # Real time date (for lag gate)
    realtime = parse_date(args.realtime_date) if args.realtime_date else dt.date.today()

    model_store = Path(args.model_store).expanduser().resolve()
    if not model_store.exists():
        raise FileNotFoundError(f"--model-store does not exist: {model_store}")

    # -------- DB: AOI + Model cfg --------
    with psycopg.connect(args.pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_AOI, (args.aoi_name,))
            row = cur.fetchone()
            if not row:
                raise RuntimeError(f"AOI not found: {args.aoi_name}")
            aoi_id = row[0]

            cur.execute(GET_MODEL, (args.model_name, args.model_version))
            row = cur.fetchone()
            if not row:
                raise RuntimeError(f"Model/version not found: {args.model_name} / {args.model_version}")
            model_id, cfg_raw = row

    cfg = parse_cfg(cfg_raw)
    horizon = int(cfg["forecast_horizon"])

    req_start = issue_date
    req_end = issue_date + dt.timedelta(days=horizon - 1)


    # Lag gate applies to requested *end-date*
    lag_gate(req_end, realtime, args.min_lag_days)

    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(exist_ok=True, parents=True)

    # ============================================================
    # SINGLE MODE ONLY
    # ============================================================

    # Keep original constraint: requested length cannot exceed horizon
    req_len = (req_end - req_start).days + 1
    if req_len > horizon:
        raise ValueError(
            f"Requested {req_len} days exceeds horizon={horizon}."
        )

    result = infer_one_issue_date(
        pg_url=args.pg_url,
        model_id=model_id,
        model_version=args.model_version,
        aoi_id=aoi_id,
        aoi_name=args.aoi_name,
        cfg=cfg,
        model_store=model_store,
        issue_date=issue_date,
        device=device,
        run_status=args.run_status,
        fallback_status=args.fallback_status,
    )

    full_dates = result["full_dates"]
    ens = result["ens"]
    n_runs = result["n_runs"]

    out = pd.DataFrame(
    {
        "issue_date": issue_date,
        "forecast_date": full_dates,
        "lead_day": np.arange(1, horizon + 1),
        "forecast": ens,
        "n_runs": n_runs,
    }
)
    suffix = f"{issue_date}__H{horizon}"
    out_path = out_dir / f"forecast_{args.model_name}_{suffix}.csv"

    out.to_csv(out_path, index=False)

    print("✅ INFERENCE DONE (single)")
    print("Saved:", out_path)
    print(out)

    if not args.no_db_write:
        write_run_to_db(
            pg_url=args.pg_url,
            model_id=model_id,
            model_version=args.model_version,
            aoi_id=aoi_id,
            issue_date=issue_date,
            horizon=horizon,
            full_dates=full_dates,
            ens=ens,
            forecast_variable=args.forecast_variable,
        )
    else:
        print("ℹ️ --no-db-write set -> skipping DB write.")
    return

# ============================================================
# API WRAPPER (for FastAPI): run_forecast()
# ============================================================
def run_forecast(
    *,
    pg_url: str,
    model_name: str,
    model_version: str,
    model_id,
    aoi_name: str,
    aoi_id,
    tz: str = "Asia/Almaty",
    cfg_raw=None,
    issue_date: dt.date,
    start_date: dt.date | None = None,
    end_date: dt.date | None = None,
    model_store: Path,
    device: str = "cpu",
    run_status: str = "active",
    fallback_status: str = "done",
    # what we store in DB as "model output":
    forecast_variable: str = "streamflow_mm_day",
    min_lag_days: int = 30,
    realtime_date: dt.date | None = None,
    write_db: bool = True,
    # ✅ make it optional in signature, but required in logic
    area_m2: float | None = None,
    # ✅ if True -> also store discharge_m3s in DB
    write_discharge: bool = True,
) -> dict:
    """
    API behavior:
      - ALWAYS returns m3/s in response
    DB behavior:
      - writes streamflow_mm_day (forecast_variable)
      - optionally writes discharge_m3s рядом (same run_id)
    """

    if area_m2 is None or area_m2 <= 0:
        raise ValueError("area_m2 is required (>0) to return discharge in m3/s")

    # ---- parse config ----
    cfg = parse_cfg(cfg_raw) if cfg_raw is not None else None
    if cfg is None:
        with psycopg.connect(pg_url) as conn:
            with conn.cursor() as cur:
                cur.execute(GET_MODEL, (model_name, model_version))
                row = cur.fetchone()
                if not row:
                    raise RuntimeError(f"Model/version not found: {model_name} / {model_version}")
                _mid, cfg_raw2 = row
        cfg = parse_cfg(cfg_raw2)

    horizon = int(cfg["forecast_horizon"])

    # ---- dates (single horizon only) ----
    req_start = start_date or issue_date
    req_end = end_date or (issue_date + dt.timedelta(days=horizon - 1))

    if req_end < req_start:
        raise ValueError("end_date must be >= start_date")
    if req_start < issue_date:
        raise ValueError("In single mode start_date must be >= issue_date")
    req_len = (req_end - req_start).days + 1
    if req_len > horizon:
        raise ValueError(f"Requested {req_len} days exceeds horizon={horizon} (single mode).")

    realtime = realtime_date if realtime_date is not None else dt.date.today()
    lag_gate(req_end, realtime, int(min_lag_days))

    dev = pick_device(device)

    # ---- run inference (mm/day predictions) ----
    res = infer_one_issue_date(
        pg_url=pg_url,
        model_id=model_id,
        model_version=model_version,
        aoi_id=aoi_id,
        aoi_name=aoi_name,
        cfg=cfg,
        model_store=model_store,
        issue_date=issue_date,
        device=dev,
        run_status=run_status,
        fallback_status=fallback_status,
    )

    full_dates = res["full_dates"]          # horizon dates
    ens_mm_day = res["ens"]                 # horizon values in mm/day

    # slice to requested window
    start_idx = (req_start - issue_date).days
    end_idx = start_idx + req_len

    db_run_ids: list[str] = []

    # ---- write to DB (mm/day + optional discharge) ----
    if write_db:
        db_run_id = write_run_to_db(
            pg_url=pg_url,
            model_id=model_id,
            model_version=model_version,
            aoi_id=aoi_id,
            issue_date=issue_date,
            horizon=horizon,
            full_dates=full_dates,
            ens=ens_mm_day,
            forecast_variable=forecast_variable,   # e.g. streamflow_mm_day
        )
        db_run_ids.append(str(db_run_id))

        if write_discharge:
            # write second variable discharge_m3s into same run_id / dates
            rows_daily = []
            for i in range(horizon):
                q = mm_day_to_discharge_m3s(float(ens_mm_day[i]), float(area_m2))
                rows_daily.append(
                    (
                        uuid.uuid4(),         # forecast_id
                        db_run_id,            # same run_id
                        full_dates[i],
                        i + 1,
                        "discharge_m3s",
                        float(round3(q)),
                    )
                )
            with psycopg.connect(pg_url, autocommit=True) as conn:
                with conn.cursor() as cur:
                    cur.executemany(INSERT_FORECAST_DAILY, rows_daily)

    # ---- API response ALWAYS in m3/s ----
    out_rows: list[dict] = []
    for i in range(start_idx, end_idx):
        q = mm_day_to_discharge_m3s(float(ens_mm_day[i]), float(area_m2))
        out_rows.append(
            {
                "forecast_date": str(full_dates[i]),
                "value": float(round3(q)),
                "lead_day": int(i + 1),
                "issue_date": str(issue_date),
                "unit": "m3/s",
            }
        )

    return {"db_run_ids": db_run_ids, "forecast": out_rows}


# def run_forecast(
#     *,
#     pg_url: str,
#     model_name: str,
#     model_version: str,
#     model_id,
#     aoi_name: str,
#     aoi_id,
#     tz: str = "Asia/Almaty",
#     cfg_raw=None,                 # optional: pass config_json directly to avoid extra DB fetch
#     issue_date: dt.date,
#     start_date: dt.date | None = None,
#     end_date: dt.date | None = None,
#     model_store: Path,
#     device: str = "cpu",
#     run_status: str = "active",
#     fallback_status: str = "done",
#     forecast_variable: str = "streamflow",
#     min_lag_days: int = 30,
#     realtime_date: dt.date | None = None,
#     write_db: bool = True,
#     area_m2: float,
#     write_discharge: bool = True
# ) -> dict:
#     """
#     Returns dict:
#       {
#         "db_run_ids": [ ... ],
#         "forecast": [ {"forecast_date": "YYYY-MM-DD", "value": float, "lead_day": int, "issue_date": "YYYY-MM-DD"} ... ]
#       }
#     """

#     # parse config
#     cfg = parse_cfg(cfg_raw) if cfg_raw is not None else None
#     if cfg is None:
#         # fallback: fetch cfg via existing SQL in this module
#         with psycopg.connect(pg_url) as conn:
#             with conn.cursor() as cur:
#                 cur.execute(GET_MODEL, (model_name, model_version))
#                 row = cur.fetchone()
#                 if not row:
#                     raise RuntimeError(f"Model/version not found: {model_name} / {model_version}")
#                 _mid, cfg_raw2 = row
#         cfg = parse_cfg(cfg_raw2)

#     horizon = int(cfg["forecast_horizon"])

#     # dates    
#     req_start = issue_date
#     req_end = issue_date + dt.timedelta(days=horizon - 1)

#     realtime = realtime_date if realtime_date is not None else dt.date.today()
#     lag_gate(req_end, realtime, int(min_lag_days))

#     # device
#     dev = pick_device(device)

#     db_run_ids: list[str] = []
#     out_rows: list[dict] = []

#     # -------------------------
#     # SINGLE
#     # -------------------------

#     req_len = (req_end - req_start).days + 1
#     if req_len > horizon:
#         raise ValueError(
#             f"Requested {req_len} days exceeds horizon={horizon}. Use mode='range' for longer periods."
#         )
#     if req_start < issue_date:
#         raise ValueError("In single mode start_date must be >= issue_date")

#     res = infer_one_issue_date(
#         pg_url=pg_url,
#         model_id=model_id,
#         model_version=model_version,
#         aoi_id=aoi_id,
#         aoi_name=aoi_name,
#         cfg=cfg,
#         model_store=model_store,
#         issue_date=issue_date,
#         device=dev,
#         run_status=run_status,
#         fallback_status=fallback_status,
#     )

#     full_dates = res["full_dates"]
#     ens = res["ens"]
#     start_idx = (req_start - issue_date).days
#     end_idx = start_idx + req_len

#     if write_db:
#         # writes FULL horizon to DB (like your CLI)
#         rid = write_run_to_db(
#             pg_url=pg_url,
#             model_id=model_id,
#             model_version=model_version,
#             aoi_id=aoi_id,
#             issue_date=issue_date,
#             horizon=horizon,
#             full_dates=full_dates,
#             ens=ens,
#             forecast_variable=forecast_variable,
#         )
#         db_run_ids.append(str(rid))


#     for i in range(horizon):
#         out_rows.append(
#             {
#                 "forecast_date": str(full_dates[i]),
#                 "value": float(ens[i]),
#                 "lead_day": int(i + 1),
#                 "issue_date": str(issue_date),
#             }
#         )

#     return {"db_run_ids": db_run_ids, "forecast": out_rows}

if __name__ == "__main__":
    main()



