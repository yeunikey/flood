# utils/unit_convert.py
from __future__ import annotations

def mm_day_to_discharge_m3s(mm_day: float, area_m2: float) -> float:
    # Q = (mm/day / 1000) * area / 86400
    return (mm_day / 1000.0) * area_m2 / 86400.0

def discharge_m3s_to_mm_day(q_m3s: float, area_m2: float) -> float:
    # mm/day = Q * 86400 / area * 1000
    return (q_m3s * 86400.0 / area_m2) * 1000.0

def round3(x: float) -> float:
    return float(f"{x:.3f}")
