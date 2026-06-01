import {
  CategorySiteStatsRow,
  CategoryStats,
  CategoryStatsRow,
  DataGroupIsoPayload,
  DataGroupPayload,
  RawDataGroupRow,
  RawDataValueRow,
  SiteStats,
} from '../types/data.types';

type ValuesMap = Map<number, { variables: number[]; values: string[] }>;

const toIsoStringOrNull = (value: Date | string | null): string | null =>
  value ? new Date(value).toISOString() : null;

const stringOrEmpty = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const mapSiteStatsByCategory = (
  rows: CategorySiteStatsRow[],
): Map<number, SiteStats[]> =>
  rows.reduce<Map<number, SiteStats[]>>((sites, site) => {
    const categoryId = Number(site.categoryId);
    const categorySites = sites.get(categoryId) ?? [];

    categorySites.push({
      siteId: Number(site.siteId),
      siteCode: site.siteCode,
      siteName: site.siteName,
      groupsCount: Number(site.groupsCount),
      valuesCount: Number(site.valuesCount),
      variablesCount: Number(site.variablesCount),
      lastDate: toIsoStringOrNull(site.lastDate),
    });
    sites.set(categoryId, categorySites);

    return sites;
  }, new Map<number, SiteStats[]>());

export const mapCategoryStats = (
  rows: CategoryStatsRow[],
  sitesByCategory: Map<number, SiteStats[]>,
): CategoryStats[] =>
  rows.map((category) => ({
    categoryId: Number(category.categoryId),
    categoryName: category.categoryName,
    groupsCount: Number(category.groupsCount),
    valuesCount: Number(category.valuesCount),
    variablesCount: Number(category.variablesCount),
    lastDate: toIsoStringOrNull(category.lastDate),
    sites: sitesByCategory.get(Number(category.categoryId)) ?? [],
  }));

export const buildDataValuesMap = (
  rows: RawDataValueRow[],
  emptyValue = '',
): ValuesMap => {
  const valuesMap: ValuesMap = new Map();

  for (const row of rows) {
    const groupId = row.group_id;
    const entry = valuesMap.get(groupId) ?? { variables: [], values: [] };

    entry.variables.push(row.variable_id);
    entry.values.push(row.value ?? emptyValue);
    valuesMap.set(groupId, entry);
  }

  return valuesMap;
};

export const mapRawGroup = (
  group: RawDataGroupRow,
  valuesMap: ValuesMap,
): DataGroupPayload => {
  const values = valuesMap.get(Number(group.id)) ?? {
    variables: [],
    values: [],
  };

  return {
    id: Number(group.id),
    date_utc: new Date(group.date_utc),
    category: Number(group.category),
    site_code: stringOrEmpty(group.site_code),
    method: {
      name: stringOrEmpty(group.method_name),
      description: stringOrEmpty(group.method_description),
    },
    source: {
      name: stringOrEmpty(group.source_name),
    },
    qcl: {
      name: stringOrEmpty(group.qcl_name),
      description: stringOrEmpty(group.qcl_description),
    },
    variables: values.variables,
    values: values.values,
  };
};

export const mapRawGroupToIso = (
  group: RawDataGroupRow,
  valuesMap: ValuesMap,
): DataGroupIsoPayload => {
  const mapped = mapRawGroup(group, valuesMap);

  return {
    ...mapped,
    date_utc: mapped.date_utc.toISOString(),
  };
};
