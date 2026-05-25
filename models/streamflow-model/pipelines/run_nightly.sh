#!/usr/bin/env bash

set -e

# --- Activate conda environment ---
source ~/anaconda3/etc/profile.d/conda.sh
conda activate etl

# --- Go to project directory ---
cd ~/models_ETL/models_ETL_new

# --- Optional variable ---
export DRY_RUN=""

# --- Create logs folder if missing ---
mkdir -p logs

# --- Timestamp ---
d=$(date +"%Y-%m-%d")
t=$(date +"%H%M")

LOG_FILE="logs/nightly_${d}_${t}.log"

# --- Run pipeline ---
python pipelines/run_nightly_all_models.py \
    --n-days 10 \
    --lag-days 5 \
    > "$LOG_FILE" 2>&1


