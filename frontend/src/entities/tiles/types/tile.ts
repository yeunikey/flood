import Pool from "@/entities/pool/types/pool";

interface Tile {
    id: string;
    name: string;
    geoPath: string;
    mbtilesPath: string;
    type: 'geojson' | 'geotiff';
    colorMode: 'solid' | 'gradient';
    selectedVariable: string;
    solidColor: string;
    gradientColorA: string;
    gradientColorB: string;
    pool?: Pool
}

export default Tile;