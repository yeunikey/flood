import psycopg

# !!! ВСТАВЬ СВОЙ ПАРОЛЬ !!!
PG_URL = "postgresql://app_writer:flood2025@localhost:5432/hydro_forecasts"

DDL = [

# -------------------------------------------------
# MODELS
# -------------------------------------------------
"""
create table if not exists models (
  model_id uuid primary key default gen_random_uuid(),
  model_name text not null unique,
  family text not null,
  scope text not null check (scope in ('aoi','station')),
  target text not null,
  description text,
  created_at timestamptz default now()
);
""",

# -------------------------------------------------
# MODEL VERSIONS
# -------------------------------------------------
"""
create table if not exists model_versions (
  model_id uuid not null references models(model_id) on delete cascade,
  version text not null,
  status text not null check (status in ('staging','production')),
  config_json jsonb not null,
  weights_uri text not null,
  created_at timestamptz default now(),
  primary key (model_id, version)
);
""",

# -------------------------------------------------
# AOI (BASINS / POLYGONS)
# -------------------------------------------------
"""
create table if not exists aoi (
  aoi_id uuid primary key default gen_random_uuid(),
  aoi_name text not null unique,
  geom geometry(Polygon, 4326) not null,
  metadata jsonb,
  created_at timestamptz default now()
);
""",

"""
create index if not exists idx_aoi_geom
on aoi using gist (geom);
""",

# -------------------------------------------------
# DAILY AOI FEATURES (MODEL INPUT)
# -------------------------------------------------
"""
create table if not exists features_daily_aoi (
  aoi_id uuid not null references aoi(aoi_id) on delete cascade,
  date date not null,
  variable text not null,
  stat text not null,
  value double precision not null,
  created_at timestamptz default now(),
  primary key (aoi_id, date, variable, stat)
);
""",

"""
create index if not exists idx_features_daily_aoi_date
on features_daily_aoi (aoi_id, date);
""",

# -------------------------------------------------
# MODEL RUNS
# -------------------------------------------------
"""
create table if not exists model_run (
  run_id uuid primary key default gen_random_uuid(),
  model_id uuid not null,
  version text not null,
  issue_time timestamptz not null,
  horizon_days int not null,
  status text not null,
  created_at timestamptz default now(),
  unique (model_id, version, issue_time)
);
""",

# -------------------------------------------------
# FORECASTS (LUMPED / AOI)
# -------------------------------------------------
"""
create table if not exists forecast_daily_aoi_point (
  run_id uuid not null references model_run(run_id) on delete cascade,
  aoi_id uuid not null references aoi(aoi_id) on delete cascade,
  target_date date not null,
  lead_days int not null,
  value double precision not null,
  created_at timestamptz default now(),
  primary key (run_id, aoi_id, target_date)
);
"""
]

def main():
    print("Connecting to DB...")
    with psycopg.connect(PG_URL, autocommit=True) as conn:
        with conn.cursor() as cur:
            for sql in DDL:
                cur.execute(sql)
    print("✅ Database initialized successfully (with geometry).")

if __name__ == "__main__":
    main()
