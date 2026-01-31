import Site from "@/entities/site/types/site";
import { Spatial } from "@/entities/spatial/types/spatial";
import { FeatureCollection } from "geojson";

interface Pool {
  id: number;
  name: string;
  description: string;
  geojson: FeatureCollection;
  sites: Site[];
  spatials: Spatial[];
}

export default Pool;
