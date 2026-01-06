import Site from "@/entities/site/types/site";
import Tile from "@/entities/tiles/types/tile";
import { FeatureCollection } from "geojson";

interface Pool {
    id: number;
    name: string;
    geojson: FeatureCollection;
    sites: Site[];
    tiles: Tile[];
}


export default Pool;