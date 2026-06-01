import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoieWV1bmlrZXkiLCJhIjoiY205cjdpbTV5MWxyazJpc2FiMWZ3NnVjaSJ9.Fm89p6MOyo_GqvT4uEXpeQ";

const DEM_SOURCE_ID = "mapbox-dem";
const DEM_HILLSHADE_LAYER_ID = "dem-hillshade";

type Props = {
  className?: string;
  setMap?: (map: mapboxgl.Map) => void;
  mapStyle?: string;
  transformRequest?: mapboxgl.TransformRequestFunction;
};

function enable3DMap(map: mapboxgl.Map) {
  if (!map.isStyleLoaded()) return;

  map.setProjection("mercator");

  if (!map.getSource(DEM_SOURCE_ID)) {
    map.addSource(DEM_SOURCE_ID, {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }

  map.setTerrain({
    source: DEM_SOURCE_ID,
    exaggeration: 1.35,
  });

  if (!map.getLayer(DEM_HILLSHADE_LAYER_ID)) {
    map.addLayer({
      id: DEM_HILLSHADE_LAYER_ID,
      type: "hillshade",
      source: DEM_SOURCE_ID,
      paint: {
        "hillshade-exaggeration": 0.35,
        "hillshade-shadow-color": "#334155",
        "hillshade-highlight-color": "#f8fafc",
        "hillshade-accent-color": "#64748b",
      },
    });
  }
}

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
      pitch: 62,
      bearing: -25,
      antialias: true,
      attributionControl: false,
      logoPosition: "bottom-right",
      transformRequest: transformRequest,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.ScaleControl());
    map.on("style.load", () => enable3DMap(map));
    map.on("load", () => enable3DMap(map));

    if (setMap) setMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, transformRequest, setMap]);

  return <div ref={mapContainer} className={className} />;
}

export default MapboxMap;
