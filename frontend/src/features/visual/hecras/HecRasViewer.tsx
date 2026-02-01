import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Box, Slider, Typography, IconButton, Paper } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { useParams } from "next/navigation";
import { api, baseUrl } from "@/shared/model/api/instance";

mapboxgl.accessToken =
  "pk.eyJ1IjoieWV1bmlrZXkiLCJhIjoiY205cjdpbTV5MWxyazJpc2FiMWZ3NnVjaSJ9.Fm89p6MOyo_GqvT4uEXpeQ";

interface MapMetadata {
  bounds?: [number, number, number, number];
  center?: [number, number];
  minzoom?: number;
  maxzoom?: number;
  has_time?: boolean;
}

export default function HecRasViewer() {
  const { id } = useParams<{ id: string }>();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initialFitDone = useRef(false);

  const layersLoaded = useRef(false);

  const [metadata, setMetadata] = useState<MapMetadata | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;

    api.get(`tiles/hec-ras/map/metadata/${id}`).then((res) => {
      setMetadata(res.data);
    });

    api.get(`tiles/hec-ras/map/times/${id}`).then((data) => {
      setTimes(data.data.times || []);
    });
  }, [id]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [82.6, 48.5],
      zoom: 6,
      transformRequest: (url, resourceType) => {
        if (url.startsWith(baseUrl) && resourceType === "Tile") {
          const token = localStorage.getItem("token");
          if (token) {
            return {
              url,
              headers: { Authorization: `Bearer ${token}` },
            };
          }
        }
        return { url };
      },
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("load", () => {
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !metadata || initialFitDone.current) return;

    if (metadata.bounds) {
      map.current.fitBounds(metadata.bounds, { padding: 50, animate: true });
      initialFitDone.current = true;
    } else if (metadata.center) {
      map.current.setCenter(metadata.center);
      map.current.setZoom(metadata.maxzoom ? metadata.maxzoom - 2 : 10);
      initialFitDone.current = true;
    }
  }, [metadata]);

  // 1. Предзагрузка ВСЕХ слоев (Preloading)
  useEffect(() => {
    const m = map.current;
    if (
      !m ||
      !id ||
      !isMapLoaded ||
      layersLoaded.current ||
      (!metadata?.has_time && times.length === 0 && metadata)
    )
      return;

    // Находим ID слоя с метками, чтобы вставлять растр ПОД них
    const firstSymbolId = m
      .getStyle()
      .layers.find((layer) => layer.type === "symbol")?.id;

    // Если есть времена, создаем слой для каждого времени
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
            bounds: metadata?.bounds,
            minzoom: metadata?.minzoom,
            maxzoom: metadata?.maxzoom,
          });

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
          bounds: metadata?.bounds,
          minzoom: metadata?.minzoom,
          maxzoom: metadata?.maxzoom,
        });

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

    layersLoaded.current = true;
  }, [id, metadata, times, isMapLoaded]);

  useEffect(() => {
    const m = map.current;
    if (!m || !isMapLoaded || !layersLoaded.current || times.length === 0)
      return;

    const currentLayerId = `hec-ras-layer-${currentTimeIndex}`;

    if (m.getLayer(currentLayerId)) {
      const firstSymbolId = m
        .getStyle()
        .layers.find((layer) => layer.type === "symbol")?.id;

      try {
        m.moveLayer(currentLayerId, firstSymbolId);
      } catch (e) {}

      m.setLayoutProperty(currentLayerId, "visibility", "visible");
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
  }, [currentTimeIndex, times, isMapLoaded]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && times.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => (prev + 1) % times.length);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, times]);

  if (!id) return null;

  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {times.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            maxWidth: 600,
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            zIndex: 1000,
          }}
        >
          <IconButton onClick={() => setIsPlaying(!isPlaying)} color="primary">
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>

          <Slider
            min={0}
            max={times.length - 1}
            value={currentTimeIndex}
            onChange={(_, val) => {
              setIsPlaying(false);
              setCurrentTimeIndex(val as number);
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(index) => times[index]}
            sx={{ flex: 1 }}
          />

          <Typography
            variant="body2"
            sx={{ minWidth: 150, textAlign: "right", whiteSpace: "nowrap" }}
          >
            {times[currentTimeIndex]}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
