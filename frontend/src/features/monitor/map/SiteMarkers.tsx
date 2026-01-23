import { useEffect, useRef } from "react";
import { useMonitorMap } from "../model/useMonitorMap";
import { useMonitorSites } from "../model/useMonitorSites";
import mapboxgl from 'mapbox-gl';
import { useLayers } from "@/entities/layer/model/useLayers";
import { useMonitorStore } from "../model/useMontorStore";


function SiteMarkers() {

    const { map } = useMonitorMap();
    const { activeSites } = useMonitorSites();
    const { layers } = useLayers();
    const markerRefs = useRef<mapboxgl.Marker[]>([]);
    const { setSelectedSite, setSelectedCategory } = useMonitorStore();

    const generateColorFromId = (id: number) => {
        const hue = (id * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    useEffect(() => {
        if (!map) return;

        const addMarkers = () => {
            // Удаляем старые маркеры
            markerRefs.current.forEach(marker => marker.remove());
            markerRefs.current = [];

            // Итерируем активные сайты
            activeSites.forEach(site => {
                const layer = layers.find(l => l.sites.some(s => s.id === site.id));
                const color = layer ? generateColorFromId(layer.category.id) : '#007bff';

                if (!layer) return;

                const el = document.createElement('div');
                el.className = 'custom-marker';
                el.id = `marker-${site.id}`;
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.backgroundColor = color;
                el.style.border = '3px solid white';
                el.style.borderRadius = '50%';
                el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
                el.style.cursor = 'pointer';
                el.style.zIndex = '1000';

                el.onclick = () => {
                    setSelectedSite(site);
                    setSelectedCategory(layer.category);
                };

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([site.longtitude, site.latitude])
                    .setPopup(new mapboxgl.Popup().setText(site.name))
                    .addTo(map);

                markerRefs.current.push(marker);
            });
        };

        if (!map.isStyleLoaded()) {
            map.once('load', addMarkers);
        } else {
            addMarkers();
        }

        return () => {
            markerRefs.current.forEach(marker => marker.remove());
            markerRefs.current = [];
        };
    }, [map, activeSites, layers]);

    return null;
}

export default SiteMarkers;
