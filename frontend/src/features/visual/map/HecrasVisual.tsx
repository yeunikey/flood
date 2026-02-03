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

  // 1. Загрузка метаданных и времени
  useEffect(() => {
    if (!activeHecras?.id) return;

    initialFitDone.current = false;
    setMetadata(null);
    setTimes([]);

    // Исправил пути API, чтобы совпадали с NestJS контроллером (hec-ras/map/...)
    api.get(`hec-ras/map/metadata/${activeHecras.id}`).then((res) => {
      setMetadata(res.data);
    });

    api.get(`hec-ras/map/times/${activeHecras.id}`).then((res) => {
      setTimes(res.data.times || []);
    });
  }, [activeHecras?.id, setMetadata, setTimes]);

  // 2. Установка границ карты (Fit Bounds)
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

  // 3. Основная логика отрисовки (Перенесено из HecRasViewer: ОДИН слой, обновление по времени)
  useEffect(() => {
    const m = map;
    if (!m || !id || !isMapLoaded || !metadata) return;

    // Ждем загрузки стиля, иначе addSource упадет
    if (!m.isStyleLoaded()) return;

    const sourceId = "hec-ras-source";
    const layerId = "hec-ras-layer";
    const currentTime = times[currentTimeIndex];

    // Формируем URL
    let tileUrl = `${baseUrl}/tile/${id}/{z}/{x}/{y}.png`;

    // Добавляем время только если оно есть и поддерживается
    if (metadata.has_time && currentTime) {
      tileUrl += `?time=${encodeURIComponent(currentTime)}`;
    }

    // Удаляем старый слой и источник, чтобы обновить тайлы
    // Mapbox эффективно кэширует, но для смены URL тайлов проще всего пересоздать source
    if (m.getLayer(layerId)) {
      m.removeLayer(layerId);
    }
    if (m.getSource(sourceId)) {
      m.removeSource(sourceId);
    }

    // Добавляем источник с новым URL
    m.addSource(sourceId, {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      bounds: metadata.bounds,
      minzoom: metadata.minzoom,
      maxzoom: metadata.maxzoom,
    });

    // Находим слой, под который нужно положить растр (обычно под метки/текст)
    const layers = m.getStyle().layers;
    const firstSymbolId = layers?.find((layer) => layer.type === "symbol")?.id;

    // Добавляем слой
    m.addLayer(
      {
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: { "raster-opacity": 0.8 },
      },
      firstSymbolId,
    );
  }, [map, id, isMapLoaded, metadata, times, currentTimeIndex]); // Зависимость от currentTimeIndex вызывает обновление слоя

  // 4. Анимация
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && times.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => (prev + 1) % times.length);
      }, 800); // Чуть увеличил интервал (800мс), чтобы тайлы успевали грузиться
    }
    return () => clearInterval(interval);
  }, [isPlaying, times, setCurrentTimeIndex]);

  return null;
}

export default HecrasVisual;
