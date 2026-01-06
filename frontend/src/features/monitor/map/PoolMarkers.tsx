import { useEffect, useRef } from "react";
import { useMonitorSites } from "../model/useMonitorSites";
import { useMonitorMap } from "../model/useMonitorMap";

function PoolMarkers() {
    const { activePools } = useMonitorSites();
    const { map } = useMonitorMap();

    const layerRefs = useRef<string[]>([]);

    useEffect(() => {
        if (!map) return;

        layerRefs.current.forEach(layerId => {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(layerId)) map.removeSource(layerId);
        });
        layerRefs.current = [];

        activePools.forEach(pool => {
            if (!pool.geojson) return;

            const layerId = `pool-${pool.id}`;

            map.addSource(layerId, {
                type: "geojson",
                data: pool.geojson
            });

            map.addLayer({
                id: layerId,
                type: "fill",
                source: layerId,
                layout: {},
                paint: {
                    "fill-color": "#007bff",
                    "fill-opacity": 0.4,
                    "fill-outline-color": "#0056b3"
                }
            });

            layerRefs.current.push(layerId);
        });

        return () => {
            layerRefs.current.forEach(layerId => {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(layerId)) map.removeSource(layerId);
            });
            layerRefs.current = [];
        };
    }, [map, activePools]);

    return null;
}

export default PoolMarkers;
