#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Purpose
-------
This module exposes a FastAPI microservice that provides two complementary capabilities
for hydrological forecasting workflows:

1) Online inference endpoint (`POST /forecast`)
   - Resolves a model and its latest (or requested) version from Postgres metadata tables
   - Resolves the active AOI binding (aoi_id, timezone) for that model version
   - Loads the model configuration JSON (`config_json`) for the resolved version
   - Reads AOI area (m²) from `aoi_attributes` for unit conversion needs
   - Runs the forecast by calling `forecast.inference_lstm_lumped.run_forecast(...)`
   - Optionally writes forecast outputs back to the database (and optionally writes
     discharge_m3s alongside streamflow_mm_day)

2) Historical retrieval endpoint (`POST /forecast-range`)
   - Queries the database for previously stored forecast results (lead_day=1 only)
     within a specified date interval
   - Returns a simple time series suitable for plotting/validation dashboards
   - Can optionally convert stored `streamflow` (mm/day) values to discharge (m³/s)
     using AOI area (m²)

It also exposes a convenience endpoint (`GET /dates`) that returns a fixed start date
and the current date for UI date pickers / simple client validation.

Key Requirements
----------------
- Environment variables:
  - PG_URL (required): Postgres connection string
  - MODEL_STORE (required): local path to model artifacts directory
  - TZ_DEFAULT (optional): timezone fallback (default: "Asia/Almaty")

- Database tables expected (minimum):
  - models(model_id, model_name)
  - model_versions(model_id, version, created_at, config_json)
  - model_aoi(model_id, model_version, aoi_id, tz, is_active)
  - aoi(aoi_id, aoi_name)
  - aoi_attributes(aoi_id, area_m2)
  - forecast_run(...)
  - forecast_daily_aoi(run_id, lead_day, variable, value, ...)

- `run_forecast` must be importable from:
  - forecast.inference_lstm_lumped

- Unit conversion helper must be importable from:
  - utils.unit_convert (mm_day_to_discharge_m3s, round3)

Assumptions / Notes
-------------------
- `POST /forecast` always forces `forecast_variable="streamflow"` when calling
  `run_forecast` (the API treats the model output in DB as mm/day), and relies on
  `run_forecast` to prepare the response `forecast` list (expected to be in m³/s if
  `run_forecast` performs conversion using `area_m2` and `write_discharge`).
- `POST /forecast-range` reads stored forecasts for lead_day=1 only, using the SQL
  query `GET_FORECAST_RANGE_LEAD1`.
- Status filtering is supported for retrieval via `statuses` array (SQL: status = any(%s)).

Endpoints
---------
1) POST /forecast
   Run inference for a given model + issue_date, optionally writing results to DB.

   Request model: ForecastRequest
   - model_name: str (required)
   - model_version: Optional[str] (if omitted -> latest)
   - issue_date: str (required, "YYYY-MM-DD")
   - run_status: str (default "active")
   - fallback_status: str (default "done")
   - device: str (default "cpu"; "cpu" | "cuda")
   - forecast_variable: str (default "streamflow") [kept but API enforces mm/day internally]
   - min_lag_days: int (default 30)
   - realtime_date: Optional[str] (default None -> dt.date.today())
   - write_db: bool (default True)
   - write_discharge: bool (default True)

   Response model: ForecastResponse
   - model_name: str
   - model_version: str
   - aoi_name: str
   - tz: str
   - issue_date: str
   - db_run_ids: List[str]
   - forecast: List[Dict[str, Any]]

2) GET /dates
   Returns a simple allowed date range.
   Response model: DatesResponse
   - start_date: str
   - end_date: str

3) POST /forecast-range
   Retrieve stored forecasts (lead_day=1) for a date interval.

   Request model: ForecastRangeRequest
   - model_name: str (required)
   - model_version: Optional[str] (if omitted -> latest)
   - start_date: str (required, "YYYY-MM-DD")
   - end_date: str (required, "YYYY-MM-DD")
   - db_variable: str (default "discharge_m3s")
       If "streamflow", values are assumed mm/day and converted to m³/s in response
       using AOI area (m²).
   - statuses: List[str] (default ["done"])

   Response model: ForecastRangeResponse
   - model_name: str
   - model_version: str
   - aoi_name: str
   - tz: str
   - start_date: str
   - end_date: str
   - unit: str (always "m3/s")
   - series: List[{"date": "YYYY-MM-DD", "value": float}]
----------

"""


from __future__ import annotations

import os
import datetime as dt
from pathlib import Path
from typing import Optional, List, Dict, Any

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from forecast.inference_lstm_lumped import run_forecast  # ты уже добавляла/добавишь run_forecast()
from utils.unit_convert import mm_day_to_discharge_m3s, round3


PG_URL = os.environ.get("PG_URL", "")
MODEL_STORE = os.environ.get("MODEL_STORE", "")
TZ_FALLBACK = os.environ.get("TZ_DEFAULT", "Asia/Almaty")
# ✅ NEW: how many days your data is delayed (set by env, default 6)
DATA_LATENCY_DAYS = int(os.environ.get("DATA_LATENCY_DAYS", "6"))

if not PG_URL:
    raise RuntimeError("Set env PG_URL")
if not MODEL_STORE:
    raise RuntimeError("Set env MODEL_STORE")


GET_MODEL_ID = "select model_id from models where model_name=%s"

GET_LATEST_VERSION = """
select version
from model_versions
where model_id=%s
order by created_at desc nulls last, version desc
limit 1
"""

GET_CFG = """
select v.config_json
from model_versions v
where v.model_id=%s and v.version=%s
"""

GET_MODEL_AOI = """
select aoi_id, tz
from model_aoi
where model_id=%s and model_version=%s and is_active=true
limit 1
"""

GET_AOI_NAME = "select aoi_name from aoi where aoi_id=%s"


GET_AOI_AREA = """
select area_m2
from aoi_attributes
where aoi_id=%s
"""


# KEEPING EXACTLY AS REQUESTED
GET_FORECAST_RANGE_LEAD1 = """
select
    fr.issue_date as date,
    f.value as value
from forecast_run fr
join forecast_daily_aoi f
  on f.run_id = fr.run_id
where fr.model_id = %s
  and fr.model_version = %s
  and fr.aoi_id = %s
  and fr.issue_date between %s and %s
  and f.lead_day = 1
  and f.variable = %s
  and fr.status = any(%s)
order by fr.issue_date asc
"""

GET_CACHED_FORECAST = """
select
    fr.run_id,
    f.forecast_date,
    f.lead_day,
    f.variable,
    f.value
from forecast_run fr
join forecast_daily_aoi f on f.run_id = fr.run_id
where fr.model_id = %s
  and fr.model_version = %s
  and fr.aoi_id = %s
  and fr.issue_date = %s
  and f.variable = any(%s)
  and fr.status = any(%s)
order by f.lead_day asc
"""

GET_AVAILABLE_ISSUE_DATES = """
select distinct fr.issue_date
from forecast_run fr
join forecast_daily_aoi f on f.run_id = fr.run_id
where fr.model_id = %s
  and fr.model_version = %s
  and fr.aoi_id = %s
  and fr.status = any(%s)
  and f.lead_day = 1
  and f.variable = %s
order by fr.issue_date asc
"""


def parse_date(s: str) -> dt.date:
    try:
        return dt.date.fromisoformat(s)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Bad date '{s}', expected YYYY-MM-DD")


# ✅ NEW: hard restriction for issue_date vs data availability
def validate_issue_date(issue_date: dt.date, realtime_date: dt.date) -> None:
    # sanity: issue_date cannot be in the future relative to realtime_date
    if issue_date > realtime_date:
        raise HTTPException(
            status_code=400,
            detail=f"issue_date {issue_date.isoformat()} cannot be after realtime_date {realtime_date.isoformat()}",
        )

    # key rule: latest available obs end at (realtime_date - DATA_LATENCY_DAYS)
    max_allowed_issue = realtime_date - dt.timedelta(days=DATA_LATENCY_DAYS)
    if issue_date > max_allowed_issue:
        raise HTTPException(
            status_code=400,
            detail=(
                f"issue_date {issue_date.isoformat()} is too recent. "
                f"Latest allowed issue_date is {max_allowed_issue.isoformat()} "
                f"(DATA_LATENCY_DAYS={DATA_LATENCY_DAYS}, realtime_date={realtime_date.isoformat()})."
            ),
        )

def db_one(pg_url: str, sql: str, params: tuple):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()


def db_all(pg_url: str, sql: str, params: tuple):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()


def resolve_model_id(model_name: str):
    row = db_one(PG_URL, GET_MODEL_ID, (model_name,))
    if not row:
        raise HTTPException(status_code=404, detail=f"Model not found: {model_name}")
    return row[0]


def resolve_model_version(model_id, model_version: Optional[str]) -> str:
    if model_version:
        return model_version
    row = db_one(PG_URL, GET_LATEST_VERSION, (model_id,))
    if not row:
        raise HTTPException(status_code=404, detail="No versions found for this model_id")
    return row[0]


def load_cfg(model_id, model_version: str):
    row = db_one(PG_URL, GET_CFG, (model_id, model_version))
    if not row or row[0] is None:
        raise HTTPException(status_code=404, detail=f"config_json not found for version={model_version}")
    return row[0]


def resolve_aoi_and_tz(model_id, model_version: str):
    row = db_one(PG_URL, GET_MODEL_AOI, (model_id, model_version))
    if not row:
        raise HTTPException(
            status_code=400,
            detail=f"model_aoi mapping not found or inactive for model_version={model_version}. "
                   f"Insert into model_aoi (model_id, model_version, aoi_id, tz, is_active)."
        )
    aoi_id, tz = row[0], row[1] or TZ_FALLBACK

    row2 = db_one(PG_URL, GET_AOI_NAME, (aoi_id,))
    if not row2:
        raise HTTPException(status_code=500, detail=f"aoi_id from model_aoi not found in aoi table: {aoi_id}")
    aoi_name = row2[0]
    return aoi_id, aoi_name, tz


def get_cached_forecast(
    model_id,
    model_version: str,
    aoi_id,
    issue_date: dt.date,
    area_m2: float,
) -> Optional[Dict[str, Any]]:
    rows = db_all(
        PG_URL,
        GET_CACHED_FORECAST,
        (
            model_id,
            model_version,
            aoi_id,
            issue_date,
            ["discharge_m3s", "streamflow"],
            ["done", "active"],
        ),
    )
    if not rows:
        return None

    discharge_rows = [row for row in rows if row[3] == "discharge_m3s"]
    selected_rows = discharge_rows or [row for row in rows if row[3] == "streamflow"]
    if not selected_rows:
        return None

    forecast_rows = []
    for _, forecast_date, lead_day, variable, value in selected_rows:
        result_value = float(value)
        if variable == "streamflow":
            result_value = mm_day_to_discharge_m3s(result_value, area_m2)
        forecast_rows.append(
            {
                "forecast_date": forecast_date.isoformat(),
                "lead_day": int(lead_day),
                "value": round3(result_value),
                "unit": "m3/s",
                "source": "database",
            }
        )

    return {"db_run_ids": [str(selected_rows[0][0])], "forecast": forecast_rows}


class ForecastRequest(BaseModel):
    model_name: str = Field(..., description="Main key")
    model_version: Optional[str] = Field(None, description="If omitted, latest version is used")

    issue_date: str = Field(..., description="YYYY-MM-DD; lead_day=1 corresponds to issue_date")

    run_status: str = Field("active")
    fallback_status: str = Field("done")

    device: str = Field("cpu", description="cpu|cuda")
    forecast_variable: str = Field("streamflow")

    min_lag_days: int = Field(30)
    realtime_date: Optional[str] = Field(None)

    write_db: bool = Field(True)
    write_discharge: bool = Field(True, description="Also write discharge_m3s alongside streamflow_mm_day")


class ForecastResponse(BaseModel):
    model_name: str
    model_version: str
    aoi_name: str
    tz: str
    issue_date: str
    db_run_ids: List[str]
    forecast: List[Dict[str, Any]]


class DatesResponse(BaseModel):
    start_date: str
    end_date: str


class AvailabilityResponse(BaseModel):
    model_name: str
    model_version: str
    aoi_name: str
    dates: List[str]
    months: List[str]
    start_date: Optional[str]
    end_date: Optional[str]


class ForecastRangeRequest(BaseModel):
    model_name: str
    model_version: Optional[str] = None

    start_date: str
    end_date: str

    db_variable: str = Field("discharge_m3s")
    statuses: List[str] = Field(default_factory=lambda: ["done"])


class ForecastRangeResponse(BaseModel):
    model_name: str
    model_version: str
    aoi_name: str
    tz: str
    start_date: str
    end_date: str
    unit: str
    series: List[Dict[str, Any]]


app = FastAPI(title="Forecast API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    model_id = resolve_model_id(req.model_name)
    model_version = resolve_model_version(model_id, req.model_version)
    cfg_raw = load_cfg(model_id, model_version)

    aoi_id, aoi_name, tz = resolve_aoi_and_tz(model_id, model_version)

    # --- AOI area (m2) for unit conversion ---
    row_area = db_one(PG_URL, GET_AOI_AREA, (aoi_id,))
    if not row_area or row_area[0] is None:
        raise HTTPException(
            status_code=500,
            detail=f"AOI area not found in aoi_attributes for aoi_id={aoi_id}. "
                   f"Insert row into aoi_attributes(aoi_id, area_m2)."
        )
    area_m2 = float(row_area[0])

    issue_date = parse_date(req.issue_date)
    realtime = parse_date(req.realtime_date) if req.realtime_date else dt.date.today()
    
    # ✅ NEW: enforce client cannot request too-recent issue_date (e.g., today)
    validate_issue_date(issue_date=issue_date, realtime_date=realtime)

    cached = get_cached_forecast(model_id, model_version, aoi_id, issue_date, area_m2)
    if cached:
        return ForecastResponse(
            model_name=req.model_name,
            model_version=model_version,
            aoi_name=aoi_name,
            tz=tz,
            issue_date=req.issue_date,
            db_run_ids=cached["db_run_ids"],
            forecast=cached["forecast"],
        )

    model_store = Path(MODEL_STORE).expanduser().resolve()
    if not model_store.exists():
        raise HTTPException(status_code=500, detail=f"MODEL_STORE not found: {model_store}")

    try:
        result = run_forecast(
            pg_url=PG_URL,
            model_name=req.model_name,
            model_version=model_version,
            model_id=model_id,
            aoi_name=aoi_name,
            aoi_id=aoi_id,
            tz=tz,
            cfg_raw=cfg_raw,
            issue_date=issue_date,
            model_store=model_store,
            device=req.device,
            run_status=req.run_status,
            fallback_status=req.fallback_status,

            # ✅ фиксируем, что модельный выход в DB — это mm/day
            forecast_variable="streamflow",

            min_lag_days=req.min_lag_days,
            realtime_date=realtime,
            write_db=req.write_db,

            # ✅ для конвертации в m3/s в ответе и для записи discharge_m3s в DB
            area_m2=area_m2,
            write_discharge=req.write_discharge,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {type(e).__name__}: {e}")

    return ForecastResponse(
        model_name=req.model_name,
        model_version=model_version,
        aoi_name=aoi_name,
        tz=tz,
        issue_date=req.issue_date,
        db_run_ids=result["db_run_ids"],
        forecast=result["forecast"],  # ✅ должно уже быть m3/s если run_forecast так сделал
    )


@app.get("/dates", response_model=DatesResponse)
def get_dates():
    start = dt.date(2021, 12, 1)
    # ✅ CHANGED: return the latest allowed issue_date for UI pickers
    end = dt.date.today() - dt.timedelta(days=DATA_LATENCY_DAYS)
    #end = dt.date.today()
    return DatesResponse(start_date=start.isoformat(), end_date=end.isoformat())


@app.get("/availability", response_model=AvailabilityResponse)
def get_availability(model_name: str, model_version: Optional[str] = None):
    model_id = resolve_model_id(model_name)
    resolved_version = resolve_model_version(model_id, model_version)
    aoi_id, aoi_name, _ = resolve_aoi_and_tz(model_id, resolved_version)
    rows = db_all(
        PG_URL,
        GET_AVAILABLE_ISSUE_DATES,
        (model_id, resolved_version, aoi_id, ["done"], "streamflow"),
    )
    dates = [row[0].isoformat() for row in rows]

    return AvailabilityResponse(
        model_name=model_name,
        model_version=resolved_version,
        aoi_name=aoi_name,
        dates=dates,
        months=sorted({date[:7] for date in dates}),
        start_date=dates[0] if dates else None,
        end_date=dates[-1] if dates else None,
    )


@app.post("/forecast-range", response_model=ForecastRangeResponse)
def forecast_range(req: ForecastRangeRequest):
    model_id = resolve_model_id(req.model_name)
    model_version = resolve_model_version(model_id, req.model_version)
    aoi_id, aoi_name, tz = resolve_aoi_and_tz(model_id, model_version)

    start = parse_date(req.start_date)
    end = parse_date(req.end_date)
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")

    rows = db_all(
        PG_URL,
        GET_FORECAST_RANGE_LEAD1,
        (model_id, model_version, aoi_id, start, end, req.db_variable, req.statuses),
    )

    area_m2 = None
    if req.db_variable == "streamflow":
        row_area = db_one(PG_URL, GET_AOI_AREA, (aoi_id,))
        if not row_area or row_area[0] is None:
            raise HTTPException(status_code=500, detail=f"AOI area not found for aoi_id={aoi_id}")
        area_m2 = float(row_area[0])

    series = []
    for d, v in rows:
        v = float(v)

        if req.db_variable == "streamflow":
            v = mm_day_to_discharge_m3s(v, area_m2)

        series.append({"date": d.isoformat(), "value": round3(v)})

    return ForecastRangeResponse(
        model_name=req.model_name,
        model_version=model_version,
        aoi_name=aoi_name,
        tz=tz,
        start_date=req.start_date,
        end_date=req.end_date,
        unit="m3/s",
        series=series,
    )
