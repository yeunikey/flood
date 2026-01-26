import { useEffect, useRef } from "react";
import { useSpatialMap } from "../model/useSpatialMap";
import { useSpatialTiles } from "../model/useSpatialTiles";
import {
  DataDrivenPropertyValueSpecification,
  ColorSpecification,
  MapSourceDataEvent,
  Popup,
  MapLayerMouseEvent,
} from "mapbox-gl";
import { useSpatialSettings } from "../model/useSpatialSettings";

type FillColorExpression = string | (string | number | string[])[];

function SpatialGeoJson() {
  const { map } = useSpatialMap();
  const { activeSpatial, activeTileId } = useSpatialTiles();
  const { tooltipEnabled } = useSpatialSettings();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!map || !activeSpatial || !activeTileId) return;

    const sourceId = "spatial-source";
    const layerId = "spatial-layer";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
      type: "vector",
      tiles: [
        `http://localhost:3001/v1/tiles/server/${activeTileId}/{z}/{x}/{y}.pbf`,
      ],
      minzoom: 0,
      maxzoom: 14,
    });

    const sourceLayer = activeTileId.replace(/-/g, "");

    let fillColorExpression: FillColorExpression = "#0080ff";

    if (activeSpatial.style.type === "solid") {
      fillColorExpression = activeSpatial.style.fillColor || "#0080ff";
    } else if (
      activeSpatial.style.type === "gradient" &&
      activeSpatial.style.gradient
    ) {
      const { variable, minColor, maxColor } = activeSpatial.style.gradient;

      fillColorExpression = [
        "interpolate",
        ["linear"],
        ["get", variable],
        0,
        minColor,
        100,
        maxColor,
      ];
    }

    map.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      "source-layer": sourceLayer,
      paint: {
        "fill-color":
          fillColorExpression as DataDrivenPropertyValueSpecification<ColorSpecification>,
        "fill-opacity": activeSpatial.style.opacity || 0.6,
        "fill-outline-color": activeSpatial.style.borderColor || "#000",
      },
    });

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

    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "320px",
      className: "spatial-hover-popup",
      offset: 15,
    });

    const handleMouseMove = (e: MapLayerMouseEvent) => {
      if (!tooltipEnabled) {
        map.getCanvas().style.cursor = "";
        popup.remove();
        return;
      }

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

      popup.setLngLat(e.lngLat).setHTML(htmlContent).addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    };

    map.on("mousemove", layerId, handleMouseMove);
    map.on("mouseleave", layerId, handleMouseLeave);

    const updateGradientBounds = () => {
      if (
        activeSpatial.style.type !== "gradient" ||
        !activeSpatial.style.gradient
      )
        return;

      const { variable, minColor, maxColor } = activeSpatial.style.gradient;

      const features = map.querySourceFeatures(sourceId, {
        sourceLayer: sourceLayer,
      });

      if (!features || features.length === 0) return;

      let min = Infinity;
      let max = -Infinity;
      let hasData = false;

      for (let i = 0; i < features.length; i++) {
        const val = features[i].properties?.[variable];
        if (typeof val === "number") {
          if (val < min) min = val;
          if (val > max) max = val;
          hasData = true;
        }
      }

      if (hasData && min !== Infinity && max !== -Infinity && min !== max) {
        map.setPaintProperty(layerId, "fill-color", [
          "interpolate",
          ["linear"],
          ["get", variable],
          min,
          minColor,
          max,
          maxColor,
        ]);
      }
    };

    const onSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(updateGradientBounds, 50);
      }
    };

    map.on("sourcedata", onSourceData);

    return () => {
      map.off("mousemove", layerId, handleMouseMove);
      map.off("mouseleave", layerId, handleMouseLeave);
      popup.remove();

      map.off("sourcedata", onSourceData);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [map, activeSpatial, activeTileId, tooltipEnabled]);

  return null;
}

export default SpatialGeoJson;
