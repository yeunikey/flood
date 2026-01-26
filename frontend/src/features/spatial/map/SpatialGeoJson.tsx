import { useEffect, useRef } from "react";
import { useSpatialMap } from "../model/useSpatialMap";
import { useSpatialTiles } from "../model/useSpatialTiles";
import {
  DataDrivenPropertyValueSpecification,
  ColorSpecification,
  Popup,
  MapLayerMouseEvent,
} from "mapbox-gl";
import { useSpatialSettings } from "../model/useSpatialSettings";

type FillColorExpression = string | (string | number | string[])[];

interface TileJsonAttribute {
  attribute: string;
  min?: number;
  max?: number;
}

interface TileJsonResponse {
  vector_layers?: { id: string }[];
  tilestats?: {
    layers: {
      attributes: TileJsonAttribute[];
    }[];
  };
}

function SpatialGeoJson() {
  const { map } = useSpatialMap();
  const { activeSpatial, activeTileId } = useSpatialTiles();
  const { tooltipEnabled } = useSpatialSettings();
  const popupRef = useRef<Popup | null>(null);

  const findMinMax = async (tileJSONUrl: string, variable: string) => {
    try {
      const res = await fetch(tileJSONUrl);
      if (!res.ok) return null;

      const data: TileJsonResponse = await res.json();

      const statsLayer = data.tilestats?.layers?.[0];
      if (!statsLayer) return null;

      const attributeInfo = statsLayer.attributes.find(
        (attr) => attr.attribute === variable,
      );

      if (!attributeInfo) return null;

      const minValue = Number(attributeInfo.min) || 0;
      const maxValue = Number(attributeInfo.max) || 100;

      return { minValue, maxValue };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  useEffect(() => {
    if (!map || !activeSpatial || !activeTileId) return;

    let isMounted = true;
    const sourceId = "spatial-source";
    const layerId = "spatial-layer";
    const outlineLayerId = "spatial-layer-outline"; // ID для слоя обводки

    const cleanup = () => {
      if (popupRef.current) popupRef.current.remove();

      // Проверяем, существует ли стиль карты перед удалением слоев
      // Это предотвращает ошибку "getOwnLayer", если карта уже уничтожена
      if (!map || !map.getStyle()) return;

      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };

    cleanup();

    map.addSource(sourceId, {
      type: "vector",
      tiles: [
        `http://localhost:3001/v1/tiles/server/${activeTileId}/{z}/{x}/{y}.pbf`,
      ],
      minzoom: 0,
      maxzoom: 14,
    });

    const sourceLayer = activeTileId.replace(/-/g, "");

    const initLayer = async () => {
      let fillColorExpression: FillColorExpression = "#0080ff";

      if (activeSpatial.style.type === "solid") {
        fillColorExpression = activeSpatial.style.fillColor || "#0080ff";
      } else if (
        activeSpatial.style.type === "gradient" &&
        activeSpatial.style.gradient
      ) {
        const { variable, minColor, maxColor } = activeSpatial.style.gradient;
        let min = 0;
        let max = 100;

        const stats = await findMinMax(
          `http://localhost:3001/v1/tiles/server/${activeTileId}.json`,
          variable,
        );

        if (stats) {
          min = stats.minValue;
          max = stats.maxValue;
        }

        fillColorExpression = [
          "interpolate",
          ["linear"],
          ["get", variable],
          min,
          minColor,
          max,
          maxColor,
        ];
      }

      if (!isMounted) return;

      // Проверка getStyle() перед добавлением слоев также полезна
      if (!map.getStyle()) return;

      const filterExpression = activeSpatial.style.gradient?.variable
        ? ["has", activeSpatial.style.gradient.variable]
        : undefined;

      // 1. Слой заливки (без обводки)
      if (map.getSource(sourceId) && !map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          "source-layer": sourceLayer,
          paint: {
            "fill-color":
              fillColorExpression as DataDrivenPropertyValueSpecification<ColorSpecification>,
            "fill-opacity": activeSpatial.style.opacity ?? 0.6,
            // Убрали fill-outline-color, чтобы не было принудительной рамки в 1px
          },
          filter: filterExpression,
        });
      }

      // 2. Отдельный слой для обводки (Line Layer)
      if (map.getSource(sourceId) && !map.getLayer(outlineLayerId)) {
        const borderWidth = activeSpatial.style.borderWidth ?? 1;

        map.addLayer({
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          "source-layer": sourceLayer,
          paint: {
            "line-color": activeSpatial.style.borderColor || "#000",
            "line-width": borderWidth,
            "line-opacity": borderWidth === 0 ? 0 : 1, // Полностью скрываем, если ширина 0
          },
          filter: filterExpression,
        });
      }
    };

    initLayer();

    const styleId = "spatial-popup-dark-theme";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        .spatial-hover-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .spatial-hover-popup .mapboxgl-popup-tip {
          border-top-color: #262626 !important;
        }
      `;
      document.head.appendChild(style);
    }

    popupRef.current = new Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "320px",
      className: "spatial-hover-popup",
      offset: 15,
    });

    const handleMouseMove = (e: MapLayerMouseEvent) => {
      if (!tooltipEnabled || !popupRef.current) return;

      if (!e.features || e.features.length === 0) return;

      map.getCanvas().style.cursor = "pointer";

      const feature = e.features[0];
      const props = feature.properties;

      if (!props) return;

      let htmlContent = `<div style="
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #262626;
        color: #e5e5e5;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        border: 1px solid #404040;
        min-width: 180px;
      ">`;

      if (
        activeSpatial.style.type === "gradient" &&
        activeSpatial.style.gradient?.variable
      ) {
        const mainVar = activeSpatial.style.gradient.variable;
        const mainVal = props[mainVar];
        if (mainVal !== undefined) {
          htmlContent += `
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #404040;
              padding-bottom: 8px;
              margin-bottom: 8px;
            ">
              <span style="color: #90caf9; font-weight: 600; font-size: 13px;">${mainVar}</span>
              <span style="color: #fff; font-weight: 700; font-size: 15px;">${mainVal}</span>
            </div>
          `;
        }
      }

      htmlContent += `<table style="width: 100%; border-collapse: collapse; font-size: 12px;">`;
      Object.entries(props).forEach(([key, value]) => {
        htmlContent += `
          <tr style="border-bottom: 1px solid #333;">
            <td style="color: #a3a3a3; padding: 4px 0; vertical-align: top;">${key}</td>
            <td style="text-align: right; color: #f5f5f5; padding: 4px 0 4px 12px; font-weight: 500; word-break: break-all;">${value}</td>
          </tr>
        `;
      });
      htmlContent += `</table></div>`;

      popupRef.current.setLngLat(e.lngLat).setHTML(htmlContent).addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      if (popupRef.current) popupRef.current.remove();
    };

    map.on("mousemove", layerId, handleMouseMove);
    map.on("mouseleave", layerId, handleMouseLeave);

    return () => {
      isMounted = false;
      map.off("mousemove", layerId, handleMouseMove);
      map.off("mouseleave", layerId, handleMouseLeave);
      cleanup();

      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [map, activeSpatial, activeTileId, tooltipEnabled]);

  return null;
}

export default SpatialGeoJson;
