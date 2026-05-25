#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
register_model.py

Registers ONE logical model + ONE version into Postgres (contract only):
- inserts/updates row in models
- inserts/updates row in model_versions with config_json

IMPORTANT ARCHITECTURE NOTE:
- We DO NOT store weights here (model_versions).
- Each training run has its own weights -> store weights_uri in model_run later.

Why we need it:
- downloader reads config_json -> knows which CDS variables to download
- ETL reads config_json -> knows which (db_variable, stat) to compute and store
- inference reads config_json -> knows feature order + preprocessing steps

This script does NOT require AOI/basin geometry.
"""

import json
import psycopg

# ------------------------------------------------------------
# 1) CONNECTION SETTINGS
# ------------------------------------------------------------
PG_URL = "postgresql://app_writer:flood2025@localhost:5432/hydro_forecasts"

# ------------------------------------------------------------
# 2) MODEL IDENTITY
# ------------------------------------------------------------
MODEL_NAME = "LSTM_lumped_Uba"
MODEL_FAMILY = "LSTM_lumped"
MODEL_SCOPE = "aoi"          # lumped basin model -> aoi scope
MODEL_TARGET = "streamflow"  # what we forecast
MODEL_VERSION = "v1.0"
MODEL_STATUS = "staging"

WEIGHTS_URI = "RUN_SPECIFIC"   # just a placeholder; real weights are stored per model_run


# ------------------------------------------------------------
# 3) MODEL CONTRACT (config_json)
# ------------------------------------------------------------
CONFIG_JSON = {
    "name": "wd_uba_lumped",
    "scope": MODEL_SCOPE,
    "target": MODEL_TARGET,

    # sequence + horizon
    "sequence_length": 30,
    "forecast_horizon": 7,

    # training hyperparameters (optional, but useful to store)
    "train_hparams": {
        "batch_size": 64,
        "learning_rate": 0.0005,
        "num_epochs": 50,
        "hidden_size": 64,
        "num_layers": 2,
        "dropout": 0.2
    },

    # mapping CDS -> DB -> model-feature
    "features": {
        "dynamic": [
            # temperature mean
            {"cds_variable": "2m_temperature", "db_variable": "temperature_2m", "stat": "mean",
             "rename_as": "temperature_2m"},

            # soil moisture layer 1 mean
            {"cds_variable": "volumetric_soil_water_layer_1", "db_variable": "volumetric_soil_water_layer_1",
             "stat": "mean", "rename_as": "volumetric_soil_water_layer_1"},

            # soil temperature level 1 mean
            {"cds_variable": "soil_temperature_level_1", "db_variable": "soil_temperature_level_1",
             "stat": "mean", "rename_as": "soil_temperature_level_1"},

            # SWE mean
            {"cds_variable": "snow_depth_water_equivalent", "db_variable": "snow_depth_water_equivalent",
             "stat": "mean", "rename_as": "snow_depth_water_equivalent"},

            # precipitation daily sum
            {"cds_variable": "total_precipitation", "db_variable": "total_precipitation",
             "stat": "sum", "rename_as": "total_precipitation_sum"},

            # temperature max
            {"cds_variable": "2m_temperature", "db_variable": "temperature_2m",
             "stat": "max", "rename_as": "temperature_2m_max"},
        ],
        "static": []
    },

    # exact feature order for scaler/model input
    "feature_order": [
        "temperature_2m",
        "volumetric_soil_water_layer_1",
        "soil_temperature_level_1",
        "snow_depth_water_equivalent",
        "total_precipitation_sum",
        "temperature_2m_max"
    ],

    # preprocessing rules
    "preprocess": [
        # Kelvin -> Celsius
        {"op": "unit_convert_add", "feature": "temperature_2m", "add": -273.15, "from": "K", "to": "C"},
        {"op": "unit_convert_add", "feature": "temperature_2m_max", "add": -273.15, "from": "K", "to": "C"},
        {"op": "unit_convert_add", "feature": "soil_temperature_level_1", "add": -273.15, "from": "K", "to": "C"},

        # if temperature_2m < 0 then precipitation_sum = 0
        {"op": "conditional_set",
         "if": {"feature": "temperature_2m", "lt": 0},
         "set": {"feature": "total_precipitation_sum", "value": 0}
         }
    ]
}

# ------------------------------------------------------------
# 4) SQL helpers (UPSERT)
# ------------------------------------------------------------
UPSERT_MODEL_SQL = """
insert into models (model_name, family, scope, target, description)
values (%s, %s, %s, %s, %s)
on conflict (model_name)
do update set
  family = excluded.family,
  scope  = excluded.scope,
  target = excluded.target,
  description = excluded.description
returning model_id;
"""

# NOTE: NO weights_uri here

UPSERT_MODEL_VERSION_SQL = """
insert into model_versions (model_id, version, status, config_json, weights_uri)
values (%s, %s, %s, %s::jsonb, %s)
on conflict (model_id, version)
do update set
  status = excluded.status,
  config_json = excluded.config_json,
  weights_uri = excluded.weights_uri,
  created_at = now();
"""


# UPSERT_MODEL_VERSION_SQL = """
# insert into model_versions (model_id, version, status, config_json)
# values (%s, %s, %s, %s::jsonb)
# on conflict (model_id, version)
# do update set
#   status = excluded.status,
#   config_json = excluded.config_json,
#   created_at = now();
# """

def main():
    description = "LSTM lumped daily streamflow forecast model for Uba basin"

    print("Connecting to DB...")
    with psycopg.connect(PG_URL, autocommit=True) as conn:
        with conn.cursor() as cur:
            # 1) upsert model row and get model_id
            cur.execute(
                UPSERT_MODEL_SQL,
                (MODEL_NAME, MODEL_FAMILY, MODEL_SCOPE, MODEL_TARGET, description)
            )
            model_id = cur.fetchone()[0]
            print(f"✅ models upserted: model_name={MODEL_NAME}, model_id={model_id}")

            # # 2) upsert model version with config_json (NO weights here)
            # cur.execute(
            #     UPSERT_MODEL_VERSION_SQL,
            #     (model_id, MODEL_VERSION, MODEL_STATUS, json.dumps(CONFIG_JSON))
            # )

            cur.execute(
                UPSERT_MODEL_VERSION_SQL,
                (model_id, MODEL_VERSION, MODEL_STATUS, json.dumps(CONFIG_JSON), WEIGHTS_URI)
            )


            print(f"✅ model_versions upserted: {MODEL_NAME} {MODEL_VERSION}")

    print("Done.")

if __name__ == "__main__":
    main()
