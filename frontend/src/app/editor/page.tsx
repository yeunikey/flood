"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Drawer,
  TextField,
  Button,
  Paper,
  Divider,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Code as CodeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  CheckBoxOutlineBlank as PolygonIcon,
  Room as PointIcon,
  PanTool as PanIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { FeatureCollection, Feature, Position } from "geojson";
import View from "@/shared/ui/View";
import MapboxMap from "@/shared/ui/MapboxMap";

// --- ТИПЫ ---
type DrawMode = "view" | "draw_point" | "draw_line" | "draw_polygon";

const INITIAL_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const loadMapboxResources = () => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).mapboxgl) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Mapbox GL JS"));
    document.body.appendChild(script);
  });
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export default function GeoJsonEditor() {
  // Состояния UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [jsonText, setJsonText] = useState(
    JSON.stringify(INITIAL_GEOJSON, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Для вкладок (1 = Пространственные данные)

  // Состояния Карты и Редактора
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [geoJson, setGeoJson] = useState<FeatureCollection>(INITIAL_GEOJSON);
  const [mode, setMode] = useState<DrawMode>("view");
  const [drawingPoints, setDrawingPoints] = useState<Position[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // --- ИНИЦИАЛИЗАЦИЯ СЛОЕВ И ИСТОЧНИКОВ ---
  useEffect(() => {
    if (!mapInstance) return;

    const initLayers = () => {
      if (mapInstance.getSource("geojson-source")) return; // Уже инициализировано

      // Источник данных (редактируемый)
      mapInstance.addSource("geojson-source", {
        type: "geojson",
        data: INITIAL_GEOJSON,
      });

      // Слой полигонов
      mapInstance.addLayer({
        id: "geojson-fill",
        type: "fill",
        source: "geojson-source",
        paint: { "fill-color": "#0080ff", "fill-opacity": 0.4 },
        filter: ["==", "$type", "Polygon"],
      });

      // Слой линий
      mapInstance.addLayer({
        id: "geojson-line",
        type: "line",
        source: "geojson-source",
        paint: { "line-color": "#0080ff", "line-width": 2 },
        filter: ["in", "$type", "Polygon", "LineString"],
      });

      // Слой точек
      mapInstance.addLayer({
        id: "geojson-circle",
        type: "circle",
        source: "geojson-source",
        paint: {
          "circle-radius": 6,
          "circle-color": "#fff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0080ff",
        },
        filter: ["==", "$type", "Point"],
      });

      // Источник и слои для рисования (временные)
      mapInstance.addSource("draw-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      mapInstance.addLayer({
        id: "draw-line",
        type: "line",
        source: "draw-source",
        paint: {
          "line-color": "#ff0000",
          "line-width": 2,
          "line-dasharray": [2, 1],
        },
      });
      mapInstance.addLayer({
        id: "draw-circle",
        type: "circle",
        source: "draw-source",
        paint: { "circle-radius": 4, "circle-color": "#ff0000" },
      });

      setMapLoaded(true);
    };

    if (mapInstance.isStyleLoaded()) {
      initLayers();
    } else {
      mapInstance.on("load", initLayers);
    }
  }, [mapInstance]);

  // --- ЛОГИКА РИСОВАНИЯ (Синхронизация) ---

  // Обновление карты при изменении GeoJSON
  useEffect(() => {
    if (!mapInstance || !mapLoaded) return;
    const source = mapInstance.getSource("geojson-source");
    if (source) {
      source.setData(geoJson);
    }
    setJsonText(JSON.stringify(geoJson, null, 2));
  }, [geoJson, mapInstance, mapLoaded]);

  // Отрисовка временной фигуры
  useEffect(() => {
    if (!mapInstance || !mapLoaded) return;
    const source = mapInstance.getSource("draw-source");
    if (!source) return;

    if (drawingPoints.length > 0) {
      const features: Feature[] = [];
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "MultiPoint", coordinates: drawingPoints },
      });
      if (drawingPoints.length > 1) {
        features.push({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: drawingPoints },
        });
      }
      source.setData({ type: "FeatureCollection", features });
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [drawingPoints, mapInstance, mapLoaded]);

  // Обработчики кликов
  useEffect(() => {
    if (!mapInstance) return;

    const handleClick = (e: any) => {
      if (mode === "view") return;
      const coords = [e.lngLat.lng, e.lngLat.lat];

      if (mode === "draw_point") {
        const newFeature: Feature = {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: coords },
        };
        setGeoJson((prev) => ({
          ...prev,
          features: [...prev.features, newFeature],
        }));
        setMode("view");
        setNotification({ message: "Точка добавлена", type: "success" });
      } else if (mode === "draw_line" || mode === "draw_polygon") {
        setDrawingPoints((prev) => [...prev, coords]);
      }
    };

    const handleDblClick = (e: any) => {
      if (mode === "view") return;
      e.preventDefault();
      if (drawingPoints.length < 2) return;

      let newFeature: Feature | null = null;
      if (mode === "draw_line") {
        newFeature = {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: drawingPoints },
        };
        setNotification({ message: "Линия создана", type: "success" });
      } else if (mode === "draw_polygon") {
        const polyCoords = [...drawingPoints, drawingPoints[0]];
        newFeature = {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [polyCoords] },
        };
        setNotification({ message: "Полигон создан", type: "success" });
      }

      if (newFeature) {
        setGeoJson((prev) => ({
          ...prev,
          features: [...prev.features, newFeature!],
        }));
      }
      setDrawingPoints([]);
      setMode("view");
    };

    mapInstance.on("click", handleClick);
    mapInstance.on("dblclick", handleDblClick);
    mapInstance.getCanvas().style.cursor = mode === "view" ? "" : "crosshair";

    return () => {
      mapInstance.off("click", handleClick);
      mapInstance.off("dblclick", handleDblClick);
      try {
        mapInstance.getCanvas().style.cursor = "";
      } catch (e) {}
    };
  }, [mode, drawingPoints, mapInstance]);

  // --- ФУНКЦИИ УПРАВЛЕНИЯ ---
  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (
        parsed.type !== "FeatureCollection" ||
        !Array.isArray(parsed.features)
      )
        throw new Error("Invalid GeoJSON");
      setGeoJson(parsed);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(geoJson, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "map_data.geojson");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setNotification({ message: "Файл скачан", type: "success" });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setGeoJson(parsed);
        setNotification({ message: "Файл загружен", type: "success" });
      } catch (err) {
        setNotification({ message: "Ошибка файла", type: "error" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClear = () => {
    if (confirm("Удалить все объекты?")) {
      setGeoJson(INITIAL_GEOJSON);
      setNotification({ message: "Очищено", type: "info" });
    }
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentPage(newValue);
  };

  // --- РЕНДЕР СТРАНИЦЫ ---
  return (
    <View
      links={["Паводки", "Редактор GeoJSON"]}
      className="flex h-[calc(100dvh-8rem)]"
    >
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 relative bg-gray-100">
          {currentPage === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              Здесь мог быть TableWidget
            </div>
          )}

          {currentPage === 1 && (
            <div className="w-full h-full relative">
              {/* КАРТА */}
              <MapboxMap className="w-full h-full" setMap={setMapInstance} />

              {/* ПАНЕЛЬ ИНСТРУМЕНТОВ (Плавающая) */}
              <Paper
                elevation={3}
                sx={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  zIndex: 10,
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  bgcolor: "rgba(255,255,255,0.95)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    textAlign: "center",
                    color: "text.secondary",
                    fontWeight: "bold",
                    fontSize: "0.7rem",
                  }}
                >
                  ИНСТРУМЕНТЫ
                </Typography>
                <ToggleButtonGroup
                  orientation="vertical"
                  value={mode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode) setMode(newMode);
                  }}
                  size="small"
                >
                  <ToggleButton value="view" aria-label="pan" size="small">
                    <Tooltip title="Просмотр (Pan)" placement="right">
                      <PanIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton
                    value="draw_point"
                    aria-label="point"
                    size="small"
                  >
                    <Tooltip title="Точка" placement="right">
                      <PointIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton
                    value="draw_line"
                    aria-label="line"
                    size="small"
                  >
                    <Tooltip title="Линия" placement="right">
                      <TimelineIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton
                    value="draw_polygon"
                    aria-label="polygon"
                    size="small"
                  >
                    <Tooltip title="Полигон" placement="right">
                      <PolygonIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
                <Divider />
                <Tooltip title="Очистить" placement="right">
                  <IconButton color="error" onClick={handleClear} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>

              {/* ПАНЕЛЬ ДЕЙСТВИЙ (Справа сверху) */}
              <Paper
                elevation={2}
                sx={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  zIndex: 10,
                  bgcolor: "rgba(255,255,255,0.95)",
                }}
              >
                <Box sx={{ display: "flex", gap: 1, p: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CodeIcon />}
                    onClick={() => setDrawerOpen(true)}
                  >
                    JSON
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    <input
                      hidden
                      type="file"
                      accept=".geojson,.json"
                      onChange={handleUpload}
                    />
                    Импорт
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    disabled={!!jsonError}
                  >
                    Экспорт
                  </Button>
                </Box>
              </Paper>

              {/* ПОДСКАЗКА РЕЖИМА */}
              {mode !== "view" && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium z-20 pointer-events-none opacity-90">
                  {mode === "draw_point" &&
                    "Кликните на карту, чтобы добавить точку"}
                  {mode === "draw_line" &&
                    "Клик: точка | Двойной клик: завершить линию"}
                  {mode === "draw_polygon" &&
                    "Клик: точка | Двойной клик: замкнуть полигон"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* JSON DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="temporary"
        PaperProps={{
          sx: {
            width: "40%",
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">GeoJSON</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            p: 0,
            bgcolor: "#1e1e1e",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {jsonError && (
            <Alert severity="error" sx={{ m: 2 }}>
              {jsonError}
            </Alert>
          )}
          <TextField
            multiline
            fullWidth
            variant="outlined"
            value={jsonText}
            onChange={handleJsonChange}
            sx={{
              flexGrow: 1,
              "& .MuiInputBase-root": {
                color: "#d4d4d4",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                height: "100%",
                alignItems: "flex-start",
                padding: 2,
              },
              "& fieldset": { border: "none" },
            }}
            InputProps={{ style: { height: "100%", overflow: "auto" } }}
          />
        </Box>
      </Drawer>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          severity={notification?.type || "info"}
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </View>
  );
}
