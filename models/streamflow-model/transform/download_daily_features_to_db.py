#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
import json
import tempfile
import threading
import zipfile
from calendar import monthrange
from pathlib import Path
from typing import Any, Iterable

import cdsapi
import numpy as np
import psycopg
import xarray as xr

try:
    from shapely.geometry import Point, box
    from shapely.prepared import prep
except Exception as e:
    raise SystemExit("Install shapely: pip install shapely") from e


GET_AOI_ID_SQL = "select aoi_id from aoi where aoi_name=%s"

GET_EXISTING_FEATURES_SQL = """
select date, variable, stat
from features_daily_aoi
where aoi_id=%s and date between %s and %s
"""

GET_MODEL_CFG_SQL = """
select v.config_json
from model_versions v
join models m using (model_id)
where m.model_name=%s and v.version=%s
"""

UPSERT_FEATURE_SQL = """
insert into features_daily_aoi (aoi_id, date, variable, stat, value)
values (%s, %s, %s, %s, %s)
on conflict (aoi_id, date, variable, stat)
do update set value=excluded.value, created_at=now();
"""


RENAME_VARS = {
    "t2m": "2m_temperature",
    "tp": "total_precipitation",
    "stl1": "soil_temperature_level_1",
    "swvl1": "volumetric_soil_water_layer_1",
    "sd": "snow_depth_water_equivalent",
}


def log(message: str) -> None:
    print(message, flush=True)


def format_bytes(size: int) -> str:
    value = float(size)
    for unit in ("B", "KiB", "MiB", "GiB"):
        if value < 1024 or unit == "GiB":
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} GiB"


class DownloadProgress:
    def __init__(self, total: int):
        self.total = total
        self.completed = 0
        self.downloaded_bytes = 0

    def retrieve(self, client, dataset: str, request: dict, target: Path, label: str) -> None:
        current = self.completed + 1
        log(f"[DOWNLOAD {current}/{self.total}] Starting {label} dataset={dataset} -> {target.name}")
        stopped = threading.Event()

        def report_in_progress() -> None:
            while not stopped.wait(20):
                current_size = target.stat().st_size if target.exists() else 0
                log(
                    f"[DOWNLOAD {current}/{self.total}] In progress {target.name} "
                    f"file_on_disk={format_bytes(current_size)} "
                    f"remaining_after_current={self.total - current}"
                )

        reporter = threading.Thread(target=report_in_progress, daemon=True)
        reporter.start()
        try:
            client.retrieve(dataset, request, str(target))
        finally:
            stopped.set()
            reporter.join()
        size = target.stat().st_size
        self.completed = current
        self.downloaded_bytes += size
        remaining = self.total - self.completed
        log(
            f"[DOWNLOAD {current}/{self.total}] Saved {target.name} "
            f"size={format_bytes(size)} total={format_bytes(self.downloaded_bytes)} "
            f"remaining={remaining}"
        )


def parse_cfg(cfg: Any) -> dict:
    if isinstance(cfg, dict):
        return cfg
    if isinstance(cfg, (str, bytes)):
        return json.loads(cfg)
    return dict(cfg)


def parse_bbox(s: str):
    try:
        minlon, minlat, maxlon, maxlat = [float(v.strip()) for v in s.split(",")]
    except Exception as e:
        raise SystemExit('Invalid --aoi-bbox. Use "minLon,minLat,maxLon,maxLat".') from e
    if minlon >= maxlon or minlat >= maxlat:
        raise SystemExit("Invalid --aoi-bbox: min values must be lower than max values.")
    return minlon, minlat, maxlon, maxlat


def daterange(start: dt.date, end: dt.date) -> Iterable[dt.date]:
    days = (end - start).days + 1
    for offset in range(days):
        yield start + dt.timedelta(days=offset)


def month_chunks(start: dt.date, end: dt.date):
    cursor = dt.date(start.year, start.month, 1)
    while cursor <= end:
        last_day = monthrange(cursor.year, cursor.month)[1]
        chunk_start = max(start, cursor)
        chunk_end = min(end, dt.date(cursor.year, cursor.month, last_day))
        yield cursor.year, cursor.month, [f"{d.day:02d}" for d in daterange(chunk_start, chunk_end)]
        if cursor.month == 12:
            cursor = dt.date(cursor.year + 1, 1, 1)
        else:
            cursor = dt.date(cursor.year, cursor.month + 1, 1)


def month_date_chunks(dates: list[dt.date]):
    grouped: dict[tuple[int, int], list[str]] = {}
    for day in dates:
        grouped.setdefault((day.year, day.month), []).append(f"{day.day:02d}")
    for (year, month), days in sorted(grouped.items()):
        yield year, month, days


def get_model_spec(pg_url: str, model_name: str, model_version: str):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_MODEL_CFG_SQL, (model_name, model_version))
            row = cur.fetchone()
    if not row:
        raise SystemExit(f"Model config not found: {model_name} {model_version}")
    cfg = parse_cfg(row[0])
    feats = cfg.get("features", {}).get("dynamic", [])
    if not feats:
        raise SystemExit("config_json.features.dynamic is empty or missing.")
    return feats


def get_aoi_id(pg_url: str, aoi_name: str):
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_AOI_ID_SQL, (aoi_name,))
            row = cur.fetchone()
    if not row:
        raise SystemExit(f"AOI not found: {aoi_name}")
    return row[0]


def get_existing_features(pg_url: str, aoi_id, start: dt.date, end: dt.date) -> set[tuple[dt.date, str, str]]:
    with psycopg.connect(pg_url) as conn:
        with conn.cursor() as cur:
            cur.execute(GET_EXISTING_FEATURES_SQL, (aoi_id, start, end))
            return {(day, variable, stat) for day, variable, stat in cur.fetchall()}


def make_aoi_mask(lat: np.ndarray, lon: np.ndarray, poly_prepared, poly_geom) -> np.ndarray:
    lon_grid, lat_grid = np.meshgrid(lon, lat)
    inside = np.zeros(lat_grid.shape, dtype=bool)
    for i in range(lat_grid.shape[0]):
        for j in range(lat_grid.shape[1]):
            inside[i, j] = poly_prepared.contains(Point(float(lon_grid[i, j]), float(lat_grid[i, j])))

    if not inside.any():
        cy, cx = poly_geom.centroid.y, poly_geom.centroid.x
        ilat = np.abs(lat - cy).argmin()
        ilon = np.abs(lon - cx).argmin()
        inside[ilat, ilon] = True
    return inside


def weighted_aoi_value(da: xr.DataArray, mask: np.ndarray) -> float:
    lat_name = "latitude" if "latitude" in da.coords else "lat"
    lon_name = "longitude" if "longitude" in da.coords else "lon"
    lat = da.coords[lat_name].values
    weights = np.cos(np.deg2rad(lat))
    weights_2d = np.broadcast_to(weights[:, None], mask.shape)
    weights_2d = np.where(mask, weights_2d, 0.0)
    weights_da = xr.DataArray(
        weights_2d,
        coords={lat_name: da.coords[lat_name], lon_name: da.coords[lon_name]},
        dims=(lat_name, lon_name),
    )
    return float((da * weights_da).sum(dim=(lat_name, lon_name), skipna=True) / weights_da.sum())


def normalize_dataset(ds: xr.Dataset) -> xr.Dataset:
    present = {k: v for k, v in RENAME_VARS.items() if k in ds.data_vars}
    if present:
        ds = ds.rename(present)
    return ds


def time_coord(ds: xr.Dataset) -> str:
    for cand in ("time", "valid_time", "date"):
        if cand in ds.coords or cand in ds.variables:
            return cand
    raise KeyError("No time coordinate found")


def request_daily_stats(client, progress: DownloadProgress, variable: str, statistic: str, dates: list[dt.date], tz: str, area, out_dir: Path) -> list[Path]:
    stat_name = {"mean": "daily_mean", "max": "daily_max", "min": "daily_min"}[statistic]
    out_paths = []
    for year, month, days in month_date_chunks(dates):
        target = out_dir / f"daily_{variable}_{statistic}_{year}_{month:02d}.zip"
        request = {
            "product_type": "reanalysis",
            "variable": [variable],
            "year": str(year),
            "month": f"{month:02d}",
            "day": days,
            "daily_statistic": stat_name,
            "time_zone": tz.lower().replace("asia/almaty", "utc+06:00"),
            "frequency": "1_hourly",
            "area": area,
            "data_format": "netcdf",
        }
        progress.retrieve(
            client,
            "derived-era5-land-daily-statistics",
            request,
            target,
            f"variable={variable} stat={statistic} month={year}-{month:02d} days={len(days)}",
        )
        out_paths.append(target)
    return out_paths


def request_daily_precip(client, progress: DownloadProgress, dates: list[dt.date], area, out_dir: Path) -> list[tuple[dt.date, Path]]:
    out = []
    for local_day in dates:
        cds_day = local_day + dt.timedelta(days=1)
        target = out_dir / f"precip_{local_day.isoformat()}.zip"
        request = {
            "variable": ["total_precipitation"],
            "year": f"{cds_day.year}",
            "month": f"{cds_day:%m}",
            "day": f"{cds_day:%d}",
            "time": ["00:00"],
            "area": area,
            "format": "netcdf",
        }
        progress.retrieve(
            client,
            "reanalysis-era5-land",
            request,
            target,
            f"variable=total_precipitation stat=sum local_day={local_day}",
        )
        out.append((local_day, target))
    return out


def extract_netcdfs(path: Path, out_dir: Path) -> list[Path]:
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as zf:
            zf.extractall(out_dir)
        extracted = list(out_dir.rglob("*.nc"))
        log(f"[EXTRACT] {path.name} -> {len(extracted)} NetCDF file(s)")
        return extracted
    return [path]


def insert_rows(pg_url: str, rows: list[tuple]) -> None:
    if not rows:
        return
    with psycopg.connect(pg_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.executemany(UPSERT_FEATURE_SQL, rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pg-url", required=True)
    ap.add_argument("--model-name", required=True)
    ap.add_argument("--model-version", required=True)
    ap.add_argument("--aoi-name", required=True)
    ap.add_argument("--aoi-bbox", required=True)
    ap.add_argument("--tz", default="Asia/Almaty")
    ap.add_argument("--start-date", required=True)
    ap.add_argument("--end-date", required=True)
    ap.add_argument("--cache-dir", default="/app/ingest/model_raw_data/daily_features")
    args = ap.parse_args()

    start = dt.date.fromisoformat(args.start_date)
    end = dt.date.fromisoformat(args.end_date)
    if end < start:
        raise SystemExit("end-date must be >= start-date")

    minlon, minlat, maxlon, maxlat = parse_bbox(args.aoi_bbox)
    area = [maxlat, minlon, minlat, maxlon]
    poly = box(minlon, minlat, maxlon, maxlat)
    poly_prepared = prep(poly)

    feats = get_model_spec(args.pg_url, args.model_name, args.model_version)
    aoi_id = get_aoi_id(args.pg_url, args.aoi_name)
    cache_dir = Path(args.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    requested_days = list(daterange(start, end))
    existing = get_existing_features(args.pg_url, aoi_id, start, end)
    pending = []
    for feat in feats:
        missing_days = [
            day for day in requested_days
            if (day, feat["db_variable"], feat["stat"]) not in existing
        ]
        pending.append((feat, missing_days))

    missing_feature_days = sum(len(missing_days) for _, missing_days in pending)
    required_feature_days = len(feats) * len(requested_days)
    precipitation_requests = sum(
        len(missing_days)
        for feat, missing_days in pending
        if feat["cds_variable"] == "total_precipitation" and feat["stat"] == "sum"
    )
    statistics_requests = sum(
        sum(1 for _ in month_date_chunks(missing_days))
        for feat, missing_days in pending
        if not (feat["cds_variable"] == "total_precipitation" and feat["stat"] == "sum")
    )
    progress = DownloadProgress(precipitation_requests + statistics_requests)
    log(
        f"[INGEST] ERA5-Land daily features model={args.model_name} "
        f"range={start}..{end} features={len(feats)} "
        f"existing={required_feature_days - missing_feature_days}/{required_feature_days} "
        f"missing={missing_feature_days} downloads={progress.total}"
    )
    log(f"[INGEST] Cache directory: {cache_dir}")
    if not missing_feature_days:
        log("[DONE] All required daily features already exist in DB. Nothing to download.")
        return

    client = cdsapi.Client()
    rows_written = 0

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)

        for feature_no, (feat, missing_days) in enumerate(pending, start=1):
            cds_var = feat["cds_variable"]
            db_var = feat["db_variable"]
            stat = feat["stat"]
            if not missing_days:
                log(
                    f"[SKIP FEATURE {feature_no}/{len(feats)}] variable={cds_var} "
                    f"stat={stat}: all {len(requested_days)} day(s) already in DB"
                )
                continue

            feature_rows = []
            log(
                f"[FEATURE {feature_no}/{len(feats)}] variable={cds_var} stat={stat} "
                f"db_variable={db_var} missing_days={len(missing_days)}"
            )

            if cds_var == "total_precipitation" and stat == "sum":
                for local_day, response_path in request_daily_precip(client, progress, missing_days, area, cache_dir):
                    netcdf_paths = extract_netcdfs(response_path, tmp_dir / f"precip_{local_day.isoformat()}")
                    if not netcdf_paths:
                        raise RuntimeError(f"No NetCDF file found in CDS response: {response_path}")
                    for nc_path in netcdf_paths:
                        with xr.open_dataset(nc_path) as ds:
                            ds = normalize_dataset(ds)
                            da = ds["total_precipitation"].isel({time_coord(ds): 0}).squeeze()
                            lat_name = "latitude" if "latitude" in da.coords else "lat"
                            lon_name = "longitude" if "longitude" in da.coords else "lon"
                            mask = make_aoi_mask(da.coords[lat_name].values, da.coords[lon_name].values, poly_prepared, poly)
                            feature_rows.append((aoi_id, local_day, db_var, stat, weighted_aoi_value(da, mask)))
                insert_rows(args.pg_url, feature_rows)
                rows_written += len(feature_rows)
                log(f"[DB] Stored variable={db_var} stat={stat} rows={len(feature_rows)}")
                continue

            if stat not in ("mean", "max", "min"):
                raise SystemExit(f"Unsupported daily stat without hourly data: {cds_var} {stat}")

            archives = request_daily_stats(client, progress, cds_var, stat, missing_days, args.tz, area, cache_dir)
            missing_set = set(missing_days)
            for archive in archives:
                for nc_path in extract_netcdfs(archive, tmp_dir / archive.stem):
                    with xr.open_dataset(nc_path) as ds:
                        ds = normalize_dataset(ds)
                        if cds_var not in ds.data_vars:
                            continue

                        da_all = ds[cds_var]
                        tcoord = time_coord(ds)
                        lat_name = "latitude" if "latitude" in da_all.coords else "lat"
                        lon_name = "longitude" if "longitude" in da_all.coords else "lon"
                        mask = make_aoi_mask(da_all.coords[lat_name].values, da_all.coords[lon_name].values, poly_prepared, poly)

                        for idx, raw_time in enumerate(ds[tcoord].values):
                            day = np.datetime_as_string(raw_time, unit="D")
                            d = dt.date.fromisoformat(day)
                            if d in missing_set:
                                feature_rows.append((aoi_id, d, db_var, stat, weighted_aoi_value(da_all.isel({tcoord: idx}).squeeze(), mask)))
            insert_rows(args.pg_url, feature_rows)
            rows_written += len(feature_rows)
            log(f"[DB] Stored variable={db_var} stat={stat} rows={len(feature_rows)}")

    log(
        f"[DONE] Daily feature ingest completed. Upserted rows={rows_written} "
        f"downloaded={format_bytes(progress.downloaded_bytes)} files={progress.completed}"
    )


if __name__ == "__main__":
    main()
