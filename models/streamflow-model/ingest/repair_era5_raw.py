#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
repair_era5_raw.py

Fixes CDS "fake .nc" files:
- If file is ZIP (starts with PK..), extract the real .nc inside and replace original.
- If file is GRIB (starts with GRIB), rename to .grib (xarray needs cfgrib).
- If file looks like HTML/text error, rename to .bad and report.
- If file is already NetCDF/HDF, keep.

Usage:
  python repair_era5_raw.py --root 
"""

import argparse
import os
import shutil
import zipfile
from pathlib import Path


def sniff_kind(path: Path) -> str:
    """
    Returns: 'zip', 'netcdf', 'hdf5', 'grib', 'text', 'empty', 'unknown'
    """
    if not path.exists():
        return "unknown"
    if path.stat().st_size == 0:
        return "empty"

    with open(path, "rb") as f:
        head = f.read(16)

    # ZIP
    if head[:4] == b"PK\x03\x04":
        return "zip"

    # GRIB
    if head[:4] == b"GRIB":
        return "grib"

    # NetCDF classic: "CDF\x01" or "CDF\x02"
    if head[:3] == b"CDF":
        return "netcdf"

    # HDF5 (NetCDF4 is HDF5 under the hood)
    if head[:8] == b"\x89HDF\r\n\x1a\n":
        return "hdf5"

    # Sometimes error pages start with "<!DO" / "<html" / "{"
    try:
        txt = head.decode("utf-8", errors="ignore").lower()
        if "<html" in txt or "<!do" in txt or "error" in txt or "unauthorized" in txt:
            return "text"
    except Exception:
        pass

    return "unknown"


def extract_nc_from_zip(zip_path: Path, out_path: Path) -> bool:
    """
    Extract the most likely real .nc file from zip into out_path (overwrite).
    Picks the largest .nc member (more robust).
    Returns True if extracted.
    """
    with zipfile.ZipFile(zip_path, "r") as z:
        infos = z.infolist()
        nc_infos = [i for i in infos if i.filename.lower().endswith(".nc")]
        if not nc_infos:
            return False

        # pick the largest .nc file (usually the real dataset)
        target_info = max(nc_infos, key=lambda i: i.file_size)
        target = target_info.filename

        # unique tmp folder per file to avoid collisions
        tmp_dir = zip_path.parent / ("__tmp_extract__" + zip_path.stem)
        tmp_dir.mkdir(exist_ok=True)

        extracted = z.extract(target, path=tmp_dir)
        extracted_path = Path(extracted)

        # move/replace to out_path
        shutil.move(str(extracted_path), str(out_path))

        # cleanup tmp_dir (best-effort)
        try:
            shutil.rmtree(tmp_dir)
        except Exception:
            pass

    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, help="Root folder where era5-land_*.nc live (recursive).")
    ap.add_argument("--dry-run", action="store_true", help="Only report, do not modify files.")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Root not found: {root}")

    files = sorted(root.rglob("era5-land_*.nc"))
    print(f"Found {len(files)} files: {root}")

    fixed = 0
    renamed = 0
    bad = 0

    for p in files:
        kind = sniff_kind(p)
        if kind in ("netcdf", "hdf5"):
            continue

        print(f"[{kind.upper():>7}] {p}")

        if args.dry_run:
            continue

        if kind == "zip":
            # backup original
            bak = p.with_suffix(p.suffix + ".zipbak")
            if not bak.exists():
                shutil.copy2(p, bak)

            ok = extract_nc_from_zip(p, p)
            if ok:
                fixed += 1
                print(f"   -> extracted real .nc into: {p}  (backup: {bak.name})")
            else:
                bad += 1
                bad_path = p.with_suffix(p.suffix + ".badzip")
                p.rename(bad_path)
                print(f"   -> ZIP had no .nc inside. Renamed to {bad_path.name}")

        elif kind == "grib":
            newp = p.with_suffix(".grib")
            p.rename(newp)
            renamed += 1
            print(f"   -> renamed to {newp.name} (open later with cfgrib)")

        elif kind in ("text", "unknown", "empty"):
            bad_path = p.with_suffix(p.suffix + ".bad")
            try:
                p.rename(bad_path)
                bad += 1
                print(f"   -> renamed to {bad_path.name} (re-download needed)")
            except Exception as e:
                print(f"   -> cannot rename: {e}")

    print("--------------------------------------------------")
    print(f"Done. fixed(zip->nc)={fixed}, renamed(grib)={renamed}, bad={bad}")
    print("Tip: re-run your ETL after repair.")
    print("--------------------------------------------------")


if __name__ == "__main__":
    main()
