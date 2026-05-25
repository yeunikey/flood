import geopandas as gpd
import psycopg
from shapely.geometry import Polygon

PG_URL = "postgresql://app_writer:flood2025@localhost:5432/hydro_forecasts"

AOI_NAME = "Uba_basin"
SHAPEFILE_PATH = r"C:\Users\user_pc\models_ETL\Uba_basin\Uba_basin-polygon.shp"   # ← поменяй путь 

def main():
    gdf = gpd.read_file(SHAPEFILE_PATH)

    if len(gdf) != 1:
        raise ValueError("AOI file must contain exactly ONE polygon")

    geom = gdf.geometry.iloc[0]

    if not isinstance(geom, Polygon):
        raise ValueError("Geometry must be Polygon")

    wkt = geom.wkt

    with psycopg.connect(PG_URL, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into aoi (aoi_name, geom)
                values (%s, ST_GeomFromText(%s, 4326))
                on conflict (aoi_name)
                do update set geom = excluded.geom;
                """,
                (AOI_NAME, wkt)
            )

    print(f"✅ AOI '{AOI_NAME}' loaded successfully")

if __name__ == "__main__":
    main()
