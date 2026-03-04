import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot, Root } from "react-dom/client";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Stack,
} from "@mui/material";
import { useLayers } from "@/entities/layer/model/useLayers";
import { useCalculationMap } from "../model/useCalculationMap";
import { useCalculationStore } from "../model/useCalculationStore";
import {
  calculations,
  Calculation,
  CalculationScheme,
} from "../model/calculations";

const SchemeCard = ({
  title,
  scheme,
}: {
  title: string;
  scheme: CalculationScheme;
}) => (
  <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 3 }}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={1.5}
    >
      <Typography fontWeight={600} fontSize="14px">
        {title}
      </Typography>
      <Box sx={{ bgcolor: "grey.100", px: 1, py: 0.5, borderRadius: 1 }}>
        <Typography fontWeight={700} fontSize="12px">
          {scheme["Закон распр."]}
        </Typography>
      </Box>
    </Stack>
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Оценка парам.
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {scheme["Оценка парам."]}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Критерий ω
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {scheme["критерий надежности (ω)"]}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Оценка s
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {scheme["оценка точности (s)"]}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" fontWeight={600}>
          Q1%
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {scheme["Q1%"]}
        </Typography>
      </Stack>
    </Stack>
  </Paper>
);

function CalculationPopupContent({
  calculation,
}: {
  calculation: Calculation;
}) {
  const [view, setView] = useState<"main" | "reduction">("main");
  const currentData =
    view === "reduction" && calculation.reduction
      ? calculation.reduction
      : calculation;

  return (
    <div className="w-xl p-2">
      <Typography variant="h6" fontWeight={700} mb={1}>
        {calculation.name}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="body2">
          Qmax: <b>{calculation.Qmax}</b> м³/с
        </Typography>
        <Box sx={{ bgcolor: "grey.100", px: 1.5, py: 0.5, borderRadius: 4 }}>
          <Typography variant="caption" color="text.secondary">
            lat {calculation.latitude.toFixed(2)}, lon{" "}
            {calculation.longitude.toFixed(2)}
          </Typography>
        </Box>
      </Stack>

      {calculation.reduction && (
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, val) => val && setView(val)}
          sx={{
            mb: 2,
            gap: 1,
            "& .MuiToggleButtonGroup-grouped": {
              border: "1px solid !important",
              borderColor: "grey.300 !important",
              borderRadius: "20px !important",
              textTransform: "none",
              px: 2,
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { opacity: "0.9" },
              },
            },
          }}
        >
          <ToggleButton value="main">Основной ряд</ToggleButton>
          <ToggleButton value="reduction">То же с приведением</ToggleButton>
        </ToggleButtonGroup>
      )}

      <Stack direction="row" spacing={2} mb={2}>
        <SchemeCard
          title="СП 33-101-2003"
          scheme={currentData["Схема расчетов СП 33-101-2003"]}
        />
        <SchemeCard
          title="Альтернативная схема"
          scheme={currentData["Альтернативная схема расчетов"]}
        />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.2 }}
      >
        Подсказка: вкладка «То же с приведением» — расчёт по приведённому
        (нормализованному) ряду.
      </Typography>
    </div>
  );
}

function CalculationMarkers() {
  const { map } = useCalculationMap();
  const { layers } = useLayers();
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const rootsRef = useRef<Root[]>([]);
  const { setActiveCalculations } = useCalculationStore();

  const generateColorFromId = (id: number) => {
    const hue = (id * 137.508) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  useEffect(() => {
    if (!map) return;

    const addMarkers = () => {
      if (!map.getCanvasContainer()) return;

      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      rootsRef.current.forEach((root) => setTimeout(() => root.unmount(), 0));
      rootsRef.current = [];

      calculations.forEach((calc) => {
        const layer = layers.find((l) =>
          l.sites.some((s) => s.code === calc.site_code),
        );
        const color = layer
          ? generateColorFromId(layer.category.id)
          : "#007bff";

        if (!layer) return;

        const el = document.createElement("div");
        el.className = "custom-marker";
        el.id = `marker-${calc.id}`;
        el.style.width = `${15}px`;
        el.style.height = `${15}px`;
        el.style.backgroundColor = color;
        el.style.border = "1px solid white";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.zIndex = "1000";

        el.onclick = () => {
          setActiveCalculations(calc);
        };

        const popupNode = document.createElement("div");
        const root = createRoot(popupNode);
        rootsRef.current.push(root);

        root.render(<CalculationPopupContent calculation={calc} />);

        const popup = new mapboxgl.Popup({
          maxWidth: "none",
          offset: 15,
        }).setDOMContent(popupNode);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([calc.longitude, calc.latitude])
          .setPopup(popup)
          .addTo(map);

        markerRefs.current.push(marker);
      });
    };

    if (!map.isStyleLoaded()) {
      map.once("load", addMarkers);
    } else {
      addMarkers();
    }

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      rootsRef.current.forEach((root) => setTimeout(() => root.unmount(), 0));
      rootsRef.current = [];
    };
  }, [map, layers, setActiveCalculations]);

  return (
    <style>{`
      .mapboxgl-popup-content {
        border-radius: 24px;
      }
      
      .mapboxgl-popup {
        z-index: 1001 !important;
      }
    `}</style>
  );
}

export default CalculationMarkers;
