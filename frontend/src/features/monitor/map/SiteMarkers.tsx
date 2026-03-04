import { useEffect, useMemo, useRef } from "react";
import { useMonitorMap } from "../model/useMonitorMap";
import { useMonitorSites } from "../model/useMonitorSites";
import mapboxgl from "mapbox-gl";
import { useLayers } from "@/entities/layer/model/useLayers";
import { useMonitorStore } from "../model/useMontorStore";
import { SNOW_DATA, SNOW_MAX_PX, SNOW_MIN_PX } from "./markers/snow_markers";

function SiteMarkers() {
  const { map } = useMonitorMap();
  const { activeSites } = useMonitorSites();
  const { layers } = useLayers();
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const { setSelectedSite, setSelectedCategory } = useMonitorStore();

  const { minVal, maxVal } = useMemo(() => {
    const values = Object.values(SNOW_DATA);
    return {
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
    };
  }, []);

  const generateColorFromId = (id: number) => {
    const hue = (id * 137.508) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getSnowMarkerSize = (value: number) => {
    if (maxVal === minVal) return (SNOW_MIN_PX + SNOW_MAX_PX) / 2;

    const normalized = (value - minVal) / (maxVal - minVal);
    return SNOW_MIN_PX + normalized * (SNOW_MAX_PX - SNOW_MIN_PX);
  };

  useEffect(() => {
    if (!map) return;

    const addMarkers = () => {
      if (!map.getCanvasContainer()) return;

      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];

      activeSites.forEach((site) => {
        const layer = layers.find((l) => l.sites.some((s) => s.id === site.id));
        const color = layer
          ? generateColorFromId(layer.category.id)
          : "#007bff";

        if (!layer) return;

        let size = 15;

        if (site.siteType.name === "Снегомерная точка") {
          const paramValue = SNOW_DATA[site.code];
          if (paramValue) {
            size = getSnowMarkerSize(paramValue);
          }
        }

        const container = document.createElement("div");
        container.style.width = `${size}px`;
        container.style.height = `${size}px`;
        container.style.cursor = "pointer";
        container.style.zIndex = "1000";
        container.style.setProperty("transition", "none", "important");

        const el = document.createElement("div");
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.backgroundColor = color;
        el.style.border = "1px solid white";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";
        el.style.boxSizing = "border-box";
        el.style.setProperty("transition", "none", "important");

        const label = document.createElement("span");
        label.textContent = site.name;
        label.style.position = "absolute";
        label.style.left = "100%";
        label.style.top = "50%";
        label.style.transform = "translateY(-50%)";
        label.style.marginLeft = "8px";
        label.style.fontSize = "12px";
        label.style.fontWeight = "semibold";
        label.style.color = "#fff";
        label.style.textShadow = "1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000";
        label.style.whiteSpace = "nowrap";
        label.style.opacity = "0";
        label.style.pointerEvents = "none";
        label.style.transition = "opacity 0.2s ease-in-out";

        container.appendChild(el);
        container.appendChild(label);

        container.onmouseenter = () => {
          label.style.opacity = "1";
        };

        container.onmouseleave = () => {
          label.style.opacity = "0";
        };

        container.onclick = () => {
          setSelectedSite(site);
          setSelectedCategory(layer.category);
        };

        const marker = new mapboxgl.Marker({ element: container, anchor: "center" })
          .setLngLat([site.longtitude, site.latitude])
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
    };
  }, [map, activeSites, layers]);

  return null;
}

export default SiteMarkers;