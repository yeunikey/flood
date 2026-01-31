import MapboxMap from "@/shared/ui/MapboxMap";
import { useMonitorMap } from "./model/useMonitorMap";
import PublicLayersMap from "./map/PublicLayersMap";
import SiteMarkers from "./map/SiteMarkers";
import PoolMarkers from "./map/PoolMarkers";
import { useEffect } from "react";
import { useSettings } from "../settings/model/useSettings";

function MonitorMap() {
  const { map, setMap } = useMonitorMap();
  const { projection, style } = useSettings();

  useEffect(() => {
    if (!map) return;
    map.setProjection(projection);
    map.setStyle(style.link);
  }, [map, projection, style]);

  return (
    <div className="flex-1 relative min-h-0 bg-[#eef0f2] overflow-hidden">
      <div className="absolute inset-0 flex flex-col">
        <PublicLayersMap />
        <SiteMarkers />
        <PoolMarkers />
        <MapboxMap className="flex-1" setMap={setMap} />
      </div>
    </div>
  );
}

export default MonitorMap;
