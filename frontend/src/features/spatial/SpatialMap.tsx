import MapboxMap from "@/shared/ui/MapboxMap";
import { useEffect } from "react";
import { useSettings } from "../settings/model/useSettings";
import { useSpatialMap } from "./model/useSpatialMap";
import SpatialGeoJson from "./map/SpatialGeoJson";

function SpatialMap() {

    const { map, setMap } = useSpatialMap();
    const { projection, style } = useSettings();

    useEffect(() => {
        if (!map) return;

        map.setProjection(projection)
        map.setStyle(style.link);

    }, [map, projection, style])

    return (
        <div className="h-full flex flex-col relative">
            <SpatialGeoJson />

            <MapboxMap className="flex-1" setMap={setMap} />
        </div>
    );
}

export default SpatialMap;