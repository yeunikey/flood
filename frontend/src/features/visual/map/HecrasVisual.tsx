import { useEffect, useRef } from "react";
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

    api
      .get(`${baseUrl}/tiles/hec-ras/map/metadata/${activeHecras.id}`)
      .then((res) => {
        setMetadata(res.data);
      });

    api
      .get(`${baseUrl}/tiles/hec-ras/map/times/${activeHecras.id}`)
      .then((res) => {
        setTimes(res.data.times || []);
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
        map.fitBounds(metadata.bounds as [number, number, number, number], {
          padding: 50,
          animate: true,
        });
        initialFitDone.current = true;
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    } else if (metadata.center) {
      map.setCenter(metadata.center as [number, number]);
      map.setZoom(metadata.maxzoom ? metadata.maxzoom - 2 : 10);
      initialFitDone.current = true;
    }
  }, [map, metadata]);

  useEffect(() => {
    const m = map;
    if (!m || !id || !isMapLoaded || !metadata) return;
    if (!m.isStyleLoaded()) return;

    const currentTime = times[currentTimeIndex];

    const layerId = `hec-ras-layer-${id}-${currentTimeIndex}`;
    const sourceId = `hec-ras-source-${id}-${currentTimeIndex}`;

    let tileUrl = `${baseUrl}/tiles/hec-ras/map/tiles/${id}/{z}/{x}/{y}.png`;

    if (metadata.has_time && currentTime) {
      tileUrl += `?time=${encodeURIComponent(currentTime)}`;
    }

    if (m.getLayer(layerId)) return;

    if (!m.getSource(sourceId)) {
      m.addSource(sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        bounds: metadata.bounds as [number, number, number, number],
        minzoom: metadata.minzoom,
        maxzoom: metadata.maxzoom,
      });
    }

    const layers = m.getStyle().layers;
    const firstSymbolId = layers?.find((layer) => layer.type === "symbol")?.id;

    if (!m.getLayer(layerId)) {
      m.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": 0,
            "raster-opacity-transition": { duration: 500 },
            "raster-fade-duration": 0,
          },
        },
        firstSymbolId,
      );

      requestAnimationFrame(() => {
        if (m.getLayer(layerId)) {
          m.setPaintProperty(layerId, "raster-opacity", 0.8);
        }
      });
    }

    const timeoutId = setTimeout(() => {
      if (!m || !m.getStyle()) return;

      const currentStyle = m.getStyle();
      if (!currentStyle || !currentStyle.layers) return;

      currentStyle.layers.forEach((layer) => {
        if (
          layer.id.startsWith(`hec-ras-layer-${id}-`) &&
          layer.id !== layerId
        ) {
          if (m.getLayer(layer.id)) m.removeLayer(layer.id);

          const oldSourceId = layer.source;
          if (
            oldSourceId !== sourceId &&
            typeof oldSourceId === "string" &&
            m.getSource(oldSourceId)
          ) {
            m.removeSource(oldSourceId);
          }
        }
      });
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [map, id, isMapLoaded, metadata, times, currentTimeIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && times.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => (prev + 1) % times.length);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, times, setCurrentTimeIndex]);

  useEffect(() => {
    return () => {
      if (!map || !map.getStyle()) return;
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          if (layer.id.startsWith("hec-ras-layer-")) {
            map.removeLayer(layer.id);
            if (
              typeof layer.source === "string" &&
              map.getSource(layer.source)
            ) {
              map.removeSource(layer.source);
            }
          }
        });
      }
    };
  }, [map, id]);

  return null;
}

export default HecrasVisual;
