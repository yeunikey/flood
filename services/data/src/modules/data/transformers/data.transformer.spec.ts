import {
  buildDataValuesMap,
  mapCategoryStats,
  mapRawGroup,
  mapSiteStatsByCategory,
} from './data.transformer';

describe('data transformers', () => {
  it('maps category and site stats rows', () => {
    const sitesByCategory = mapSiteStatsByCategory([
      {
        categoryId: '1',
        siteId: '10',
        siteCode: 'UBA',
        siteName: 'Uba',
        groupsCount: '2',
        valuesCount: '4',
        variablesCount: '3',
        lastDate: '2026-01-01T00:00:00.000Z',
      },
    ]);

    expect(
      mapCategoryStats(
        [
          {
            categoryId: '1',
            categoryName: 'Hydro',
            groupsCount: '2',
            valuesCount: '4',
            variablesCount: '3',
            lastDate: '2026-01-01T00:00:00.000Z',
          },
        ],
        sitesByCategory,
      ),
    ).toEqual([
      {
        categoryId: 1,
        categoryName: 'Hydro',
        groupsCount: 2,
        valuesCount: 4,
        variablesCount: 3,
        lastDate: '2026-01-01T00:00:00.000Z',
        sites: [
          {
            siteId: 10,
            siteCode: 'UBA',
            siteName: 'Uba',
            groupsCount: 2,
            valuesCount: 4,
            variablesCount: 3,
            lastDate: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ]);
  });

  it('maps raw groups with data values', () => {
    const valuesMap = buildDataValuesMap([
      { group_id: 7, variable_id: 2, value: '42' },
      { group_id: 7, variable_id: 3, value: '24' },
    ]);

    expect(
      mapRawGroup(
        {
          id: 7,
          date_utc: '2026-01-01T00:00:00.000Z',
          site_code: 'UBA',
          category: 1,
          method_name: 'Manual',
          method_description: 'Input',
          source_name: 'Station',
          qcl_name: 'Raw',
          qcl_description: 'Unchecked',
        },
        valuesMap,
      ),
    ).toMatchObject({
      id: 7,
      category: 1,
      site_code: 'UBA',
      method: { name: 'Manual', description: 'Input' },
      source: { name: 'Station' },
      qcl: { name: 'Raw', description: 'Unchecked' },
      variables: [2, 3],
      values: ['42', '24'],
    });
  });
});
