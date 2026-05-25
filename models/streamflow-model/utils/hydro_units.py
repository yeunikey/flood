#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
utils/hydro_units.py

Конвертация расхода (m3/s) <-> слой стока (mm/day) по площади AOI.

Формулы:
  mm/day = Q(m3/s) * 86400 / area(m2) * 1000
  Q(m3/s) = mm/day / 1000 * area(m2) / 86400

Также есть удобная функция, чтобы конвертировать список forecast-строк
в ответе API и округлить до 3 знаков.
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional


SECONDS_PER_DAY = 86400.0


# ✅ Здесь можно держать площади для AOI по имени (как минимум Uba_basin)
AOI_AREA_M2: Dict[str, float] = {
    "Uba_basin": 9915866219.0,  # m2
    # добавляй сюда другие AOI при необходимости
}


def discharge_m3s_to_mm_day(q_m3s: float, area_m2: float) -> float:
    return float(q_m3s) * SECONDS_PER_DAY / float(area_m2) * 1000.0


def mm_day_to_discharge_m3s(mm_day: float, area_m2: float) -> float:
    return float(mm_day) / 1000.0 * float(area_m2) / SECONDS_PER_DAY


def round3(x: float) -> float:
    return float(f"{float(x):.3f}")


def get_aoi_area_m2(aoi_name: str, override_area_m2: Optional[float] = None) -> float:
    """
    Возвращает площадь AOI.
    Можно:
      - передать override_area_m2 (если хочешь брать из запроса/конфига)
      - либо хранить в AOI_AREA_M2 словаре по имени AOI
    """
    if override_area_m2 is not None:
        if override_area_m2 <= 0:
            raise ValueError("area_m2 must be > 0")
        return float(override_area_m2)

    if aoi_name not in AOI_AREA_M2:
        raise KeyError(
            f"Area for aoi_name='{aoi_name}' not found in AOI_AREA_M2. "
            f"Add it to utils/hydro_units.py"
        )
    return float(AOI_AREA_M2[aoi_name])


def convert_forecast_list_discharge_to_mm_day(
    forecast_rows: List[Dict[str, Any]],
    *,
    area_m2: float,
    value_key: str = "forecast",
    out_key: str = "forecast",
    round_to_3: bool = True,
) -> List[Dict[str, Any]]:
    """
    Берёт список строк прогноза (как ты отдаёшь из API),
    конвертирует value_key (m3/s) -> mm/day,
    кладёт в out_key и округляет.

    По умолчанию заменяет 'forecast' на mm/day.
    """
    out: List[Dict[str, Any]] = []
    for r in forecast_rows:
        rr = dict(r)
        v = rr.get(value_key, None)
        if v is None:
            out.append(rr)
            continue

        mm = discharge_m3s_to_mm_day(float(v), area_m2)
        if round_to_3:
            mm = round3(mm)

        rr[out_key] = mm
        out.append(rr)
    return out
