import { useEffect } from "react";
import { useSettings } from "../../../features/settings/model/useSettings";
import { useSpatialMap } from "../../../features/spatial/model/useSpatialMap";
import SpatialGeoJson from "../../../features/spatial/map/SpatialGeoJson";
import { TileSlider } from "../../../features/spatial/TileSlider";
import MapboxMap from "@/shared/ui/MapboxMap";
import SpatialURL from "../../../features/spatial/SpatialURL";
import SpatialTools from "@/features/spatial/SpatialTools";

function SpatialMap() {
  const { map, setMap } = useSpatialMap();
  const { projection, style } = useSettings();

  useEffect(() => {
    if (!map) return;
    map.setProjection(projection);
    map.setStyle(style.link);
  }, [map, projection, style]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <SpatialGeoJson />

      <SpatialTools />
      <TileSlider />

      <SpatialURL />
      <MapboxMap className="flex-1" setMap={setMap} />
    </div>
  );
}

export default SpatialMap;
