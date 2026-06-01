export interface SiteStats {
  siteId: number;
  siteCode: string;
  siteName: string;
  groupsCount: number;
  valuesCount: number;
  variablesCount: number;
  lastDate: string | null;
}

export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  groupsCount: number;
  valuesCount: number;
  variablesCount: number;
  lastDate: string | null;
  sites: SiteStats[];
}

export interface DataStats {
  dataValues: number;
  variables: number;
  categories: number;
  groups: number;
  byCategory: CategoryStats[];
}

export interface SpatialStats {
  total: number;
  tiles: number;
  withLegend: number;
  linkedToPools: number;
  solidStyle: number;
  gradientStyle: number;
}

export interface HecRasStats {
  total: number;
  latestProject: {
    id: string;
    name: string;
    originalFilename: string;
    createdAt: string;
  } | null;
}

export interface SpatialListItem {
  id: number;
  name: string;
  tilesCount: number;
  styleType: "solid" | "gradient" | string;
  legendEnabled: boolean;
  poolName: string | null;
}

export interface HecRasListItem {
  id: string;
  name: string;
  originalFilename: string;
  createdAt: string;
}
