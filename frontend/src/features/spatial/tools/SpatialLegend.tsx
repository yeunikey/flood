import { useEffect, useMemo, useState } from "react";
import { useSpatialTiles } from "../model/useSpatialTiles";
import { useSpatialMap } from "../model/useSpatialMap";
import { calculateGradientColor } from "../model/gradient.util";

export function MapLegend() {
  const { activeSpatial } = useSpatialTiles();
  const { map } = useSpatialMap();
  const [geoJsonStats, setGeoJsonStats] = useState<{
    min: number;
    max: number;
  } | null>(null);

  useEffect(() => {
    if (!map || !activeSpatial?.style?.gradient?.variable) return;

    const layerId = "spatial-layer";
    const variable = activeSpatial.style.gradient.variable;

    const updateStats = () => {
      if (!map.getLayer(layerId)) return;

      const features = map.queryRenderedFeatures({ layers: [layerId] });

      if (!features.length) return;

      let min = Infinity;
      let max = -Infinity;
      let found = false;

      features.forEach((f) => {
        const val = f.properties?.[variable];
        if (typeof val === "number") {
          if (val < min) min = val;
          if (val > max) max = val;
          found = true;
        }
      });

      if (found) {
        setGeoJsonStats((prev) => {
          if (prev && prev.min === min && prev.max === max) return prev;
          return { min, max };
        });
      }
    };

    map.on("moveend", updateStats);
    map.on("idle", updateStats);

    updateStats();

    return () => {
      map.off("moveend", updateStats);
      map.off("idle", updateStats);
    };
  }, [map, activeSpatial]);

  const { displayItems } = useMemo(() => {
    if (!activeSpatial?.legend?.enabled)
      return { displayItems: [], gradientStyle: null };

    const style = activeSpatial.style;
    const items = activeSpatial.legend.items || [];

    if (style.type === "gradient" && style.gradient) {
      const { minColor, maxColor } = style.gradient;

      let minVal = geoJsonStats ? geoJsonStats.min : 0;
      let maxVal = geoJsonStats ? geoJsonStats.max : 100;

      if (!geoJsonStats) {
        const values = items
          .map((i) => Number(i.value))
          .filter((n) => !isNaN(n));

        if (values.length) {
          minVal = Math.min(...values);
          maxVal = Math.max(...values);
        }
      }

      const computedItems = items.map((item) => {
        const val = Number(item.value);
        let calculatedColor = item.color || minColor;

        if (!isNaN(val)) {
          calculatedColor = calculateGradientColor(
            val,
            minVal,
            maxVal,
            minColor,
            maxColor,
          );
        }

        return {
          ...item,
          color: calculatedColor,
        };
      });

      return {
        displayItems: computedItems,
        gradientStyle: { minColor, maxColor, minVal, maxVal },
      };
    }

    return {
      displayItems: items,
      gradientStyle: null,
    };
  }, [activeSpatial, geoJsonStats]);

  if (!activeSpatial?.legend?.enabled) return null;

  return (
    <div className="min-w-[220px] max-w-[300px]">
      <div className="bg-white rounded-e-2xl overflow-hidden font-sans">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h6 className="font-medium text-gray-800">
            {activeSpatial.legend.title || "Легенда"}
          </h6>
          {activeSpatial.style.gradient?.variable && (
            <span className="text-sm text-gray-500 font-medium mt-0.5 block">
              ID: {activeSpatial.style.gradient.variable}
            </span>
          )}
        </div>

        <div className="p-2 space-y-4">
          <ul className="flex flex-col">
            {displayItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="text-[13px] text-gray-700 font-normal leading-snug">
                    {item.label}
                  </span>
                </div>

                <span className="text-[12px] text-gray-500 font-mono font-medium ml-4">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
          {/* {gradientStyle && (
            <div className="px-2">
              <div
                className="h-2 w-full rounded-sm"
                style={{
                  background: `linear-gradient(to right, ${gradientStyle.minColor}, ${gradientStyle.maxColor})`,
                }}
              />
              <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-medium">
                <span>{gradientStyle.minVal}</span>
                <span>{gradientStyle.maxVal}</span>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
