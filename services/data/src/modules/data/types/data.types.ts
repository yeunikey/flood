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

export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  groupsCount: number;
  valuesCount: number;
  variablesCount: number;
  lastDate: string | null;
  sites: SiteStats[];
}

export interface SiteStats {
  siteId: number;
  siteCode: string;
  siteName: string;
  groupsCount: number;
  valuesCount: number;
  variablesCount: number;
  lastDate: string | null;
}

export interface CategorySiteStatsRow {
  categoryId: string | number;
  siteId: string | number;
  siteCode: string;
  siteName: string;
  groupsCount: string;
  valuesCount: string;
  variablesCount: string;
  lastDate: Date | string | null;
}

export interface CategoryStatsRow {
  categoryId: string | number;
  categoryName: string;
  groupsCount: string;
  valuesCount: string;
  variablesCount: string;
  lastDate: Date | string | null;
}

export interface RawDataGroupRow {
  id: string | number;
  date_utc: string | Date;
  site_code: unknown;
  category: string | number;
  method_name: unknown;
  method_description: unknown;
  source_name: unknown;
  qcl_name: unknown;
  qcl_description: unknown;
}

export interface RawDataValueRow {
  group_id: number;
  variable_id: number;
  value: string;
}

export interface DataGroupPayload {
  id: number;
  date_utc: Date;
  category: number;
  site_code: string;
  method: {
    name: string;
    description: string;
  };
  source: {
    name: string;
  };
  qcl: {
    name: string;
    description: string;
  };
  variables: number[];
  values: string[];
}

export interface DataGroupIsoPayload extends Omit<
  DataGroupPayload,
  'date_utc'
> {
  date_utc: string;
}
