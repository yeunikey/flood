import { usePublicLayers } from "@/entities/layer/model/usePublicLayers";
import { FeatureCollection } from "geojson";
import { useMonitorMap } from "../model/useMonitorMap";
import { useEffect } from "react";

function PublicLayersMap() {

    const { map } = useMonitorMap();
    const { layers } = usePublicLayers();

    useEffect(() => {
        if (!map) return;

        const regionLayerId = 'regions-outline';
        const regionSourceId = 'regions';
        const watersFillId = 'waters-fill';
        const watersOutlineId = 'waters-outline';
        const watersSourceId = 'waters';
        const watersSource1Id = 'waters1';

        const loadRegions = async () => {
            try {
                const res = await fetch('/geojson/regions.geojson');
                const data: FeatureCollection = await res.json();

                if (!map.getSource(regionSourceId)) map.addSource(regionSourceId, { type: 'geojson', data });
                if (!map.getLayer(regionLayerId)) {
                    map.addLayer({
                        id: regionLayerId,
                        type: 'line',
                        source: regionSourceId,
                        paint: { 'line-color': '#ffffff', 'line-width': 1.5 },
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };

        const loadWaters = async () => {
            try {
                const res = await fetch('/geojson/waters_relations.geojson');
                const data: FeatureCollection = await res.json();
                if (!map.getSource(watersSourceId)) map.addSource(watersSourceId, { type: 'geojson', data });
                if (!map.getLayer(watersFillId)) {
                    map.addLayer({
                        id: watersFillId,
                        type: 'fill',
                        source: watersSourceId,
                        paint: { 'fill-color': '#31A3F5', 'fill-opacity': 0.5 },
                    });
                }

                const res2 = await fetch('/geojson/waters_ways.geojson');
                const data2: FeatureCollection = await res2.json();
                if (!map.getSource(watersSource1Id)) map.addSource(watersSource1Id, { type: 'geojson', data: data2 });
                if (!map.getLayer(watersOutlineId)) {
                    map.addLayer({
                        id: watersOutlineId,
                        type: 'line',
                        source: watersSource1Id,
                        paint: { 'line-color': '#31A3F5', 'line-width': 1.5 },
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };


        const removeLayerIfExists = (layerId: string, sourceId: string) => {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        };

        if (map.isStyleLoaded()) {
            if (layers.regionBorders) loadRegions();
            else removeLayerIfExists(regionLayerId, regionSourceId);

            if (layers.lakesRivers) loadWaters();
            else {
                removeLayerIfExists(watersFillId, watersSourceId);
                removeLayerIfExists(watersOutlineId, watersSource1Id);
            }
        } else {
            map.once('load', () => {
                if (layers.regionBorders) loadRegions();
                if (layers.lakesRivers) loadWaters();
            });
        }

    }, [map, layers.regionBorders, layers.lakesRivers]);

    return null;
}

export default PublicLayersMap;