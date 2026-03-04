import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { useCalculationStore } from "./model/useCalculationStore";
import { baseUrl } from "@/shared/model/api/instance";
import MapboxMap from "@/shared/ui/MapboxMap";
import { useSettings } from "@/features/settings/model/useSettings";
import { useCalculationMap } from "./model/useCalculationMap";
import CalculationMarkers from "./map/CalculationMarkers";

mapboxgl.accessToken =
  "pk.eyJ1IjoieWV1bmlrZXkiLCJhIjoiY205cjdpbTV5MWxyazJpc2FiMWZ3NnVjaSJ9.Fm89p6MOyo_GqvT4uEXpeQ";

function CalculationMap() {
  const { map, setMap } = useCalculationMap();
  const { projection, style } = useSettings();
  const { setIsMapLoaded } = useCalculationStore();

  useEffect(() => {
    if (!map) return;

    const onMapLoad = () => setIsMapLoaded(true);

    if (map.loaded()) {
      setIsMapLoaded(true);
    } else {
      map.on("load", onMapLoad);
    }

    return () => {
      map.off("load", onMapLoad);
    };
  }, [map, setIsMapLoaded]);

  useEffect(() => {
    if (!map) return;
    map.setProjection(projection);
    map.setStyle(style.link);
  }, [map, projection, style]);

  const handleTransformRequest = useCallback<mapboxgl.TransformRequestFunction>(
    (url, resourceType) => {
      if (url.startsWith(baseUrl) && resourceType === "Tile") {
        const token = localStorage.getItem("token");
        if (token) {
          return {
            url,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
        }
      }
      return { url };
    },
    [],
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <CalculationMarkers />
      <MapboxMap
        className="flex-1"
        setMap={setMap}
        transformRequest={handleTransformRequest}
      />
    </div>
  );
}

export default CalculationMap;
