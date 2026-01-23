import Pool from "@/entities/pool/types/pool";

export interface SpatialStyle {
  type: "solid" | "gradient";

  borderColor: string;
  borderWidth: number;
  opacity: number;

  fillColor?: string;

  gradient?: {
    variable: string;
    minColor: string;
    maxColor: string;
  };
}

export interface SpatialLegendItem {
  value: string | number;
  color: string;
  label: string;
}

export interface SpatialLegend {
  enabled: boolean;
  title?: string;
  items: SpatialLegendItem[];
}

export interface Spatial {
  id: number;
  name: string;
  tileIds: string[];
  style: SpatialStyle;
  legend: SpatialLegend;
  pool: Pool | null;
}
