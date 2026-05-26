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
