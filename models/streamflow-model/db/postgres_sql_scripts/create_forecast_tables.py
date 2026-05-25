#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Create forecast tables (NO pgcrypto, UUID generated in Python).
"""

import psycopg
import sys

DDL = """

-- =========================
-- 1) FORECAST RUN (metadata)
-- =========================
create table if not exists forecast_run (
    run_id          uuid primary key,

    model_id        uuid not null
        references models(model_id) on delete cascade,

    model_version   text not null,

    aoi_id          uuid not null
        references aoi(aoi_id) on delete cascade,

    issue_date      date not null,
    horizon_days    integer not null,

    ensemble_method text,
    status          text not null default 'created',

    created_at      timestamptz default now(),

    unique (model_id, model_version, aoi_id, issue_date)
);

-- =========================
-- 2) DAILY FORECAST VALUES
-- =========================
create table if not exists forecast_daily_aoi (
    forecast_id     uuid primary key,

    run_id          uuid not null
        references forecast_run(run_id) on delete cascade,

    forecast_date   date not null,
    lead_day        integer not null,

    variable        text not null,
    value           double precision not null,

    created_at      timestamptz default now(),

    unique (run_id, forecast_date, variable)
);

-- =========================
-- Indexes
-- =========================
create index if not exists idx_forecast_run_issue_date
    on forecast_run(issue_date);

create index if not exists idx_forecast_daily_run
    on forecast_daily_aoi(run_id);

create index if not exists idx_forecast_daily_date
    on forecast_daily_aoi(forecast_date);
"""

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python create_forecast_tables.py postgresql://user:pass@host:5432/db")
        sys.exit(1)

    pg_url = sys.argv[1]

    print("Connecting to DB...")
    with psycopg.connect(pg_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            print("Creating forecast tables...")
            cur.execute(DDL)

    print("✅ Forecast tables created successfully (no pgcrypto).")

if __name__ == "__main__":
    main()
