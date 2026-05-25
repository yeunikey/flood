#!/usr/bin/env python3

from __future__ import annotations

import datetime as dt
import json
import os
import time
from pathlib import Path

import psycopg


PG_URL = os.environ["PG_URL"]
MODEL_STORE = Path(os.environ.get("MODEL_STORE", "/app/models/uba_lumped"))

MODEL_ID = "11111111-1111-1111-1111-111111111111"
AOI_ID = "22222222-2222-2222-2222-222222222222"
MODEL_NAME = "LSTM_lumped_Uba"
MODEL_VERSION = "v1.0"
AOI_NAME = "Uba_basin"
AOI_AREA_M2 = 9915866219.0

CONFIG_JSON = {
    "name": "wd_uba_lumped",
    "scope": "aoi",
    "target": "streamflow",
    "sequence_length": 30,
    "forecast_horizon": 7,
    "train_hparams": {
        "batch_size": 64,
        "learning_rate": 0.0005,
        "num_epochs": 50,
        "hidden_size": 64,
        "num_layers": 2,
        "dropout": 0.2,
    },
    "features": {
        "dynamic": [
            {
                "cds_variable": "2m_temperature",
                "db_variable": "temperature_2m",
                "stat": "mean",
                "rename_as": "temperature_2m",
            },
            {
                "cds_variable": "volumetric_soil_water_layer_1",
                "db_variable": "volumetric_soil_water_layer_1",
                "stat": "mean",
                "rename_as": "volumetric_soil_water_layer_1",
            },
            {
                "cds_variable": "soil_temperature_level_1",
                "db_variable": "soil_temperature_level_1",
                "stat": "mean",
                "rename_as": "soil_temperature_level_1",
            },
            {
                "cds_variable": "snow_depth_water_equivalent",
                "db_variable": "snow_depth_water_equivalent",
                "stat": "mean",
                "rename_as": "snow_depth_water_equivalent",
            },
            {
                "cds_variable": "total_precipitation",
                "db_variable": "total_precipitation",
                "stat": "sum",
                "rename_as": "total_precipitation_sum",
            },
            {
                "cds_variable": "2m_temperature",
                "db_variable": "temperature_2m",
                "stat": "max",
                "rename_as": "temperature_2m_max",
            },
        ],
        "static": [],
    },
    "feature_order": [
        "temperature_2m",
        "volumetric_soil_water_layer_1",
        "soil_temperature_level_1",
        "snow_depth_water_equivalent",
        "total_precipitation_sum",
        "temperature_2m_max",
    ],
    "preprocess": [
        {
            "op": "unit_convert_add",
            "feature": "temperature_2m",
            "add": -273.15,
            "from": "K",
            "to": "C",
        },
        {
            "op": "unit_convert_add",
            "feature": "temperature_2m_max",
            "add": -273.15,
            "from": "K",
            "to": "C",
        },
        {
            "op": "unit_convert_add",
            "feature": "soil_temperature_level_1",
            "add": -273.15,
            "from": "K",
            "to": "C",
        },
        {
            "op": "conditional_set",
            "if": {"feature": "temperature_2m", "lt": 0},
            "set": {"feature": "total_precipitation_sum", "value": 0},
        },
    ],
}

DDL = """
create table if not exists models (
  model_id uuid primary key,
  model_name text not null unique,
  family text not null,
  scope text not null check (scope in ('aoi','station')),
  target text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists model_versions (
  model_id uuid not null references models(model_id) on delete cascade,
  version text not null,
  status text not null check (status in ('staging','production')),
  config_json jsonb not null,
  weights_uri text not null,
  created_at timestamptz default now(),
  primary key (model_id, version)
);

create table if not exists aoi (
  aoi_id uuid primary key,
  aoi_name text not null unique,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists aoi_attributes (
  aoi_id uuid primary key references aoi(aoi_id) on delete cascade,
  area_m2 double precision not null,
  created_at timestamptz default now()
);

create table if not exists model_aoi (
  model_id uuid not null references models(model_id) on delete cascade,
  model_version text not null,
  aoi_id uuid not null references aoi(aoi_id) on delete cascade,
  tz text not null default 'Asia/Almaty',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  primary key (model_id, model_version, aoi_id)
);

create table if not exists features_daily_aoi (
  aoi_id uuid not null references aoi(aoi_id) on delete cascade,
  date date not null,
  variable text not null,
  stat text not null,
  value double precision not null,
  created_at timestamptz default now(),
  primary key (aoi_id, date, variable, stat)
);

create index if not exists idx_features_daily_aoi_date
  on features_daily_aoi (aoi_id, date);

create table if not exists model_run (
  run_id uuid primary key,
  model_id uuid not null references models(model_id) on delete cascade,
  version text not null,
  issue_time timestamptz not null,
  horizon_days int not null,
  status text not null,
  weights_uri text,
  scaler_x_uri text,
  scaler_y_uri text,
  run_config jsonb,
  created_at timestamptz default now(),
  unique (model_id, version, issue_time)
);

create table if not exists forecast_run (
  run_id uuid primary key,
  model_id uuid not null references models(model_id) on delete cascade,
  model_version text not null,
  aoi_id uuid not null references aoi(aoi_id) on delete cascade,
  issue_date date not null,
  horizon_days integer not null,
  ensemble_method text,
  status text not null default 'created',
  created_at timestamptz default now(),
  unique (model_id, model_version, aoi_id, issue_date)
);

create table if not exists forecast_daily_aoi (
  forecast_id uuid primary key,
  run_id uuid not null references forecast_run(run_id) on delete cascade,
  forecast_date date not null,
  lead_day integer not null,
  variable text not null,
  value double precision not null,
  created_at timestamptz default now(),
  unique (run_id, forecast_date, variable)
);

create index if not exists idx_forecast_run_issue_date
  on forecast_run(issue_date);

create index if not exists idx_forecast_daily_run
  on forecast_daily_aoi(run_id);

create index if not exists idx_forecast_daily_date
  on forecast_daily_aoi(forecast_date);
"""


def connect_with_retry() -> psycopg.Connection:
    last_error = None
    for _ in range(60):
        try:
            return psycopg.connect(PG_URL, autocommit=True)
        except psycopg.OperationalError as exc:
            last_error = exc
            time.sleep(1)
    raise RuntimeError(f"Could not connect to streamflow database: {last_error}")


def relative_to_store(path: Path) -> str:
    return path.relative_to(MODEL_STORE).as_posix()


def newest_artifact_dir(run_dir: Path) -> Path | None:
    candidates = sorted({path.parent for path in run_dir.rglob("model_state.pt")})
    return candidates[-1] if candidates else None


def register_artifact_runs(cur: psycopg.Cursor) -> int:
    if not MODEL_STORE.exists():
        print(f"[streamflow-db] MODEL_STORE not found: {MODEL_STORE}")
        return 0

    global_scaler_x = MODEL_STORE / "scaler_X.pkl"
    run_dirs = sorted(path for path in MODEL_STORE.glob("wd_uba_lumped_run*") if path.is_dir())
    inserted = 0

    for index, run_dir in enumerate(run_dirs, start=1):
        artifact_dir = newest_artifact_dir(run_dir)
        if artifact_dir is None:
            continue

        weights = artifact_dir / "model_state.pt"
        scaler_x = artifact_dir / "scaler_X.pkl"
        scaler_y = artifact_dir / "scaler_y.pkl"

        scaler_x_uri = relative_to_store(scaler_x if scaler_x.exists() else global_scaler_x)
        scaler_y_uri = relative_to_store(scaler_y)

        if not weights.exists() or not (MODEL_STORE / scaler_x_uri).exists() or not scaler_y.exists():
            continue

        issue_time = dt.datetime(2026, 1, 30, tzinfo=dt.timezone.utc) + dt.timedelta(seconds=index)
        run_config = {
            "run_name": run_dir.name,
            "artifact_dir": relative_to_store(artifact_dir),
            "ensemble_member": True,
        }

        cur.execute(
            """
            insert into model_run (
              run_id, model_id, version, issue_time, horizon_days, status,
              weights_uri, scaler_x_uri, scaler_y_uri, run_config
            )
            values (gen_random_uuid(), %s, %s, %s, 7, 'done', %s, %s, %s, %s::jsonb)
            on conflict (model_id, version, issue_time)
            do update set
              status = excluded.status,
              weights_uri = excluded.weights_uri,
              scaler_x_uri = excluded.scaler_x_uri,
              scaler_y_uri = excluded.scaler_y_uri,
              run_config = excluded.run_config,
              created_at = now()
            """,
            (
                MODEL_ID,
                MODEL_VERSION,
                issue_time,
                relative_to_store(weights),
                scaler_x_uri,
                scaler_y_uri,
                json.dumps(run_config),
            ),
        )
        inserted += 1

    return inserted


def main() -> None:
    with connect_with_retry() as conn:
        with conn.cursor() as cur:
            cur.execute("create extension if not exists pgcrypto")
            cur.execute(DDL)

            cur.execute(
                """
                insert into models (model_id, model_name, family, scope, target, description)
                values (%s, %s, 'LSTM_lumped', 'aoi', 'streamflow', 'LSTM lumped daily streamflow forecast model for Uba basin')
                on conflict (model_name)
                do update set
                  family = excluded.family,
                  scope = excluded.scope,
                  target = excluded.target,
                  description = excluded.description
                """,
                (MODEL_ID, MODEL_NAME),
            )

            cur.execute(
                """
                insert into model_versions (model_id, version, status, config_json, weights_uri)
                values (%s, %s, 'staging', %s::jsonb, 'RUN_SPECIFIC')
                on conflict (model_id, version)
                do update set
                  status = excluded.status,
                  config_json = excluded.config_json,
                  weights_uri = excluded.weights_uri,
                  created_at = now()
                """,
                (MODEL_ID, MODEL_VERSION, json.dumps(CONFIG_JSON)),
            )

            cur.execute(
                """
                insert into aoi (aoi_id, aoi_name, metadata)
                values (%s, %s, '{}'::jsonb)
                on conflict (aoi_name)
                do update set metadata = excluded.metadata
                """,
                (AOI_ID, AOI_NAME),
            )

            cur.execute(
                """
                insert into aoi_attributes (aoi_id, area_m2)
                values (%s, %s)
                on conflict (aoi_id)
                do update set area_m2 = excluded.area_m2
                """,
                (AOI_ID, AOI_AREA_M2),
            )

            cur.execute(
                """
                insert into model_aoi (model_id, model_version, aoi_id, tz, is_active)
                values (%s, %s, %s, 'Asia/Almaty', true)
                on conflict (model_id, model_version, aoi_id)
                do update set tz = excluded.tz, is_active = excluded.is_active
                """,
                (MODEL_ID, MODEL_VERSION, AOI_ID),
            )

            runs = register_artifact_runs(cur)

    print(f"[streamflow-db] schema ready, model metadata ready, registered runs: {runs}")


if __name__ == "__main__":
    main()
