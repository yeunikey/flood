import { useMemo } from "react";
import { useHecrasStore } from "./model/useHecrasStore";

export function HecrasLegend() {
  const { metadata, activeHecras } = useHecrasStore();

  const legend = useMemo(() => {
    if (!metadata) return null;

    const valuesKey = Object.keys(metadata).find((k) =>
      k.endsWith("_legend_values"),
    );

    if (!valuesKey) return null;

    const prefix = valuesKey.replace("_legend_values", "");
    const rgbaKey = `${prefix}_legend_rgba`;
    const titleKey = `${prefix}_map_type`;

    const valuesStr = metadata[valuesKey];
    const rgbaStr = metadata[rgbaKey];
    const title = metadata[titleKey] || activeHecras?.name || "Легенда";

    if (!valuesStr || !rgbaStr) return null;

    const labels = String(valuesStr).split(",");
    const rgbaValues = String(rgbaStr)
      .split(",")
      .map((v) => Number(v.trim()));

    const items = labels
      .map((label, i) => {
        const idx = i * 4;
        if (idx + 3 >= rgbaValues.length) return null;

        const r = rgbaValues[idx];
        const g = rgbaValues[idx + 1];
        const b = rgbaValues[idx + 2];
        const a = rgbaValues[idx + 3];

        return {
          label: label.trim(),
          color: `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`,
        };
      })
      .filter(Boolean);

    return { title, items };
  }, [metadata, activeHecras]);

  if (!legend || !legend.items || legend.items.length === 0) return null;

  return (
    <div className="absolute top-16 left-0 z-20 min-w-36 max-w-75">
      <div className="bg-white rounded-e-xl overflow-hidden font-sans">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h6 className="font-medium text-gray-800">{legend.title}</h6>
        </div>

        <div className="p-2 space-y-4">
          <ul className="flex flex-col">
            {legend.items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: item!.color }}
                  />

                  <span className="text-[13px] text-gray-700 font-normal leading-snug">
                    {item!.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
