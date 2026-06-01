export const CACHE_TTL = 60 * 60 * 1000;
export const DATA_STATS_CACHE_KEY = 'data:stats:v2';
export const DATA_STATS_CACHE_TTL = 5 * 60 * 1000;

export const GROUP_RELATIONS = [
  'category',
  'site',
  'site.siteType',
  'method',
  'source',
  'qcl',
];

export const DATA_VALUE_RELATIONS = [
  'group',
  'group.category',
  'group.site',
  'group.site.siteType',
  'group.method',
  'group.source',
  'group.qcl',
  'variable',
  'variable.unit',
];
