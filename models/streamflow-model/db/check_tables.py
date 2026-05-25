import psycopg

PG_URL = "postgresql://app_writer:flood2025@localhost:5432/hydro_forecasts"

with psycopg.connect(PG_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("""
            select table_name
            from information_schema.tables
            where table_schema = 'public'
            order by table_name;
        """)
        for r in cur.fetchall():
            print(r[0])
