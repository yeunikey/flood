import psycopg

PG_URL = "postgresql://app_writer:flood2025@localhost:5432/hydro_forecasts"

with psycopg.connect(PG_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("select now();")
        print("DB time:", cur.fetchone()[0])