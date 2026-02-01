import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoieWV1bmlrZXkiLCJhIjoiY205cjdpbTV5MWxyazJpc2FiMWZ3NnVjaSJ9.Fm89p6MOyo_GqvT4uEXpeQ";

type Props = {
  className?: string;
  setMap?: (map: mapboxgl.Map) => void;
  mapStyle?: string;
  transformRequest?: mapboxgl.TransformRequestFunction;
};

function MapboxMap({
  className,
  setMap,
  mapStyle = "mapbox://styles/yeunikey/cmjj8iuzo001d01s64zku7h8w",
  transformRequest,
}: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [84, 49],
      zoom: 10,
      attributionControl: false,
      logoPosition: "bottom-right",
      transformRequest: transformRequest,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.ScaleControl());

    if (setMap) setMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, transformRequest, setMap]);

  return <div ref={mapContainer} className={className} />;
}

export default MapboxMap;
