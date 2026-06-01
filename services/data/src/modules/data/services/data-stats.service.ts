import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variable } from '../../variable/entities/variable.entity';
import { DATA_STATS_CACHE_KEY, DATA_STATS_CACHE_TTL } from '../data.constants';
import { Category } from '../entities/category.entity';
import { DataValue } from '../entities/data_value.entity';
import { Group } from '../entities/group';
import {
  mapCategoryStats,
  mapSiteStatsByCategory,
} from '../transformers/data.transformer';
import {
  CategorySiteStatsRow,
  CategoryStats,
  CategoryStatsRow,
  DataStats,
} from '../types/data.types';
import { DataCacheService } from './data-cache.service';

type CategoryGroupStatsRow = Omit<
  CategoryStatsRow,
  'valuesCount' | 'variablesCount'
>;

type ValueStatsRow = {
  categoryId: string | number;
  valuesCount: string;
  variablesCount: string;
};

type SiteGroupStatsRow = Omit<
  CategorySiteStatsRow,
  'valuesCount' | 'variablesCount'
>;

type SiteValueStatsRow = Pick<
  CategorySiteStatsRow,
  'categoryId' | 'siteId' | 'valuesCount' | 'variablesCount'
>;

@Injectable()
export class DataStatsService {
  constructor(
    @InjectRepository(DataValue)
    private readonly dataValueRepo: Repository<DataValue>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,

    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    private readonly dataCache: DataCacheService,
  ) {}

  async getStats(): Promise<DataStats> {
    return this.dataCache.getOrSet(
      DATA_STATS_CACHE_KEY,
      DATA_STATS_CACHE_TTL,
      async () => {
        const [dataValues, variables, categories, groups, byCategory] =
          await Promise.all([
            this.dataValueRepo.count(),
            this.variableRepo.count(),
            this.categoryRepo.count(),
            this.groupRepo.count(),
            this.getCategoryStats(),
          ]);

        return {
          dataValues,
          variables,
          categories,
          groups,
          byCategory,
        };
      },
    );
  }

  private async getCategoryStats(): Promise<CategoryStats[]> {
    const [categoryGroups, categoryValues, siteGroups, siteValues] =
      await Promise.all([
        this.categoryRepo
          .createQueryBuilder('category')
          .leftJoin(Group, 'grp', 'grp.category_id = category.id')
          .select('category.id', 'categoryId')
          .addSelect('category.name', 'categoryName')
          .addSelect('COUNT(grp.id)', 'groupsCount')
          .addSelect('MAX(grp.date_utc)', 'lastDate')
          .groupBy('category.id')
          .addGroupBy('category.name')
          .orderBy('category.name', 'ASC')
          .getRawMany<CategoryGroupStatsRow>(),
        this.dataValueRepo
          .createQueryBuilder('dataValue')
          .innerJoin(Group, 'grp', 'grp.id = dataValue.group_id')
          .select('grp.category_id', 'categoryId')
          .addSelect('COUNT(dataValue.id)', 'valuesCount')
          .addSelect('COUNT(DISTINCT dataValue.variable_id)', 'variablesCount')
          .groupBy('grp.category_id')
          .getRawMany<ValueStatsRow>(),
        this.groupRepo
          .createQueryBuilder('grp')
          .innerJoin('grp.site', 'site')
          .select('grp.category_id', 'categoryId')
          .addSelect('site.id', 'siteId')
          .addSelect('site.code', 'siteCode')
          .addSelect('site.name', 'siteName')
          .addSelect('COUNT(grp.id)', 'groupsCount')
          .addSelect('MAX(grp.date_utc)', 'lastDate')
          .groupBy('grp.category_id')
          .addGroupBy('site.id')
          .addGroupBy('site.code')
          .addGroupBy('site.name')
          .orderBy('site.name', 'ASC')
          .getRawMany<SiteGroupStatsRow>(),
        this.dataValueRepo
          .createQueryBuilder('dataValue')
          .innerJoin(Group, 'grp', 'grp.id = dataValue.group_id')
          .innerJoin('grp.site', 'site')
          .select('grp.category_id', 'categoryId')
          .addSelect('site.id', 'siteId')
          .addSelect('COUNT(dataValue.id)', 'valuesCount')
          .addSelect('COUNT(DISTINCT dataValue.variable_id)', 'variablesCount')
          .groupBy('grp.category_id')
          .addGroupBy('site.id')
          .getRawMany<SiteValueStatsRow>(),
      ]);

    const valuesByCategory = new Map(
      categoryValues.map((row) => [Number(row.categoryId), row]),
    );
    const valuesBySite = new Map(
      siteValues.map((row) => [
        `${Number(row.categoryId)}:${Number(row.siteId)}`,
        row,
      ]),
    );

    const rawStats: CategoryStatsRow[] = categoryGroups.map((category) => {
      const values = valuesByCategory.get(Number(category.categoryId));

      return {
        ...category,
        valuesCount: values?.valuesCount ?? '0',
        variablesCount: values?.variablesCount ?? '0',
      };
    });

    const rawSiteStats: CategorySiteStatsRow[] = siteGroups.map((site) => {
      const values = valuesBySite.get(
        `${Number(site.categoryId)}:${Number(site.siteId)}`,
      );

      return {
        ...site,
        valuesCount: values?.valuesCount ?? '0',
        variablesCount: values?.variablesCount ?? '0',
      };
    });

    return mapCategoryStats(rawStats, mapSiteStatsByCategory(rawSiteStats));
  }
}
