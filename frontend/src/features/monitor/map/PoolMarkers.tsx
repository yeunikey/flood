import { useEffect, useRef } from "react";
import { useMonitorSites } from "../model/useMonitorSites";
import { useMonitorMap } from "../model/useMonitorMap";

function PoolMarkers() {
  const { activePools } = useMonitorSites();
  const { map } = useMonitorMap();

  const layerRefs = useRef<string[]>([]);

  useEffect(() => {
    if (!map) return;

    const updateLayers = () => {
      layerRefs.current.forEach((layerId) => {
        try {
          if (map.getStyle()) {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(layerId)) map.removeSource(layerId);
          }
        } catch (e) {
          console.warn("Cleanup error:", e);
        }
      });
      layerRefs.current = [];

      activePools.forEach((pool) => {
        if (!pool.geojson) return;

        const layerId = `pool-${pool.id}`;

        if (map.getSource(layerId)) return;

        try {
          map.addSource(layerId, {
            type: "geojson",
            data: pool.geojson,
          });

          map.addLayer({
            id: layerId,
            type: "fill",
            source: layerId,
            layout: {},
            paint: {
              "fill-color": "#007bff",
              "fill-opacity": 0.4,
              "fill-outline-color": "#0056b3",
            },
          });

          layerRefs.current.push(layerId);
        } catch (e) {
          console.error("Error adding pool layer:", e);
        }
      });
    };

    if (map.isStyleLoaded()) {
      updateLayers();
    } else {
      map.once("style.load", updateLayers);
    }

    return () => {
      map.off("style.load", updateLayers);

      layerRefs.current.forEach((layerId) => {
        try {
          if (map && map.getStyle()) {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(layerId)) map.removeSource(layerId);
          }
        } catch {}
      });
      layerRefs.current = [];
    };
  }, [map, activePools]);

  return null;
}

export default PoolMarkers;
