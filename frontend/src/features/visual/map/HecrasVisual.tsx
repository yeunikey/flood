import { useEffect, useRef, useCallback } from "react";
import { api, baseUrl } from "@/shared/model/api/instance";
import { useHecrasMap } from "../model/useHecrasMap";
import { useHecrasStore } from "../model/useHecrasStore";

function HecrasVisual() {
  const { map } = useHecrasMap();
  const {
    activeHecras,
    metadata,
    times,
    currentTimeIndex,
    isPlaying,
    isMapLoaded,
    setMetadata,
    setTimes,
    setCurrentTimeIndex,
  } = useHecrasStore();

  const id = activeHecras?.id;
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (!activeHecras?.id) return;

    initialFitDone.current = false;
    setMetadata(null);
    setTimes([]);

    api.get(`tiles/hec-ras/map/metadata/${activeHecras.id}`).then((res) => {
      setMetadata(res.data);
    });

    api.get(`tiles/hec-ras/map/times/${activeHecras.id}`).then((data) => {
      setTimes(data.data.times || []);
    });
  }, [activeHecras?.id, setMetadata, setTimes]);

  useEffect(() => {
    if (!map || !metadata || initialFitDone.current) return;

    if (
      metadata.bounds &&
      Array.isArray(metadata.bounds) &&
      metadata.bounds.length === 4
    ) {
      try {
        map.fitBounds(metadata.bounds, { padding: 50, animate: true });
        initialFitDone.current = true;
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    } else if (metadata.center) {
      map.setCenter(metadata.center);
      map.setZoom(metadata.maxzoom ? metadata.maxzoom - 2 : 10);
      initialFitDone.current = true;
    }
  }, [map, metadata]);

  const updateLayers = useCallback(() => {
    const m = map;

    if (!m || !id || !isMapLoaded || !metadata) return;

    if (metadata.has_time && times.length === 0) return;

    if (!m.isStyleLoaded()) return;

    const layers = m.getStyle().layers;
    const firstSymbolId = layers?.find((layer) => layer.type === "symbol")?.id;

    if (times.length > 0) {
      times.forEach((time, index) => {
        const sourceId = `hec-ras-source-${index}`;
        const layerId = `hec-ras-layer-${index}`;
        const timeParam = `?time=${encodeURIComponent(time)}`;
        const tileUrl = `${baseUrl}/tiles/hec-ras/map/tiles/${id}/{z}/{x}/{y}.png${timeParam}`;

        if (!m.getSource(sourceId)) {
          m.addSource(sourceId, {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
            bounds: metadata.bounds,
            minzoom: metadata.minzoom,
            maxzoom: metadata.maxzoom,
          });
        }

        if (!m.getLayer(layerId)) {
          m.addLayer(
            {
              id: layerId,
              type: "raster",
              source: sourceId,
              paint: { "raster-opacity": 0.8 },
              layout: {
                visibility: index === 0 ? "visible" : "none",
              },
            },
            firstSymbolId,
          );
        }
      });
    } else {
      const sourceId = "hec-ras-source";
      const layerId = "hec-ras-layer";
      const tileUrl = `${baseUrl}/tiles/hec-ras/map/tiles/${id}/{z}/{x}/{y}.png`;

      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, {
          type: "raster",
          tiles: [tileUrl],
          tileSize: 256,
          bounds: metadata.bounds,
          minzoom: metadata.minzoom,
          maxzoom: metadata.maxzoom,
        });
      }

      if (!m.getLayer(layerId)) {
        m.addLayer(
          {
            id: layerId,
            type: "raster",
            source: sourceId,
            paint: { "raster-opacity": 0.8 },
          },
          firstSymbolId,
        );
      }
    }
  }, [map, id, isMapLoaded, metadata, times]); 

  useEffect(() => {
    if (!map) return;

    updateLayers();

    const handleStyleData = () => {
      if (map.isStyleLoaded()) {
        updateLayers();
      }
    };

    map.on("styledata", handleStyleData);
    return () => {
      map.off("styledata", handleStyleData);
    };
  }, [map, updateLayers]); 

  useEffect(() => {
    const m = map;
    if (!m || !isMapLoaded || times.length === 0) return;

    const currentLayerId = `hec-ras-layer-${currentTimeIndex}`;

    if (m.getLayer(currentLayerId)) {
      if (m.getLayoutProperty(currentLayerId, "visibility") !== "visible") {
        m.setLayoutProperty(currentLayerId, "visibility", "visible");
      }

      const firstSymbolId = m
        .getStyle()
        .layers?.find((layer) => layer.type === "symbol")?.id;
      try {
        m.moveLayer(currentLayerId, firstSymbolId);
      } catch (e) {}
    }

    const timer = setTimeout(() => {
      times.forEach((_, index) => {
        if (index !== currentTimeIndex) {
          const layerId = `hec-ras-layer-${index}`;
          if (m.getLayer(layerId)) {
            if (m.getLayoutProperty(layerId, "visibility") === "visible") {
              m.setLayoutProperty(layerId, "visibility", "none");
            }
          }
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [currentTimeIndex, times, isMapLoaded, map]);

  // 6. Анимация
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && times.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => (prev + 1) % times.length);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, times, setCurrentTimeIndex]);

  return null;
}

export default HecrasVisual;
