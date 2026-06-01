import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { DataSource as DataSourceType } from '../../metadata/entities/data_source.entity';
import { Site } from '../../sites/entities/site';
import { Variable } from '../../variable/entities/variable.entity';
import {
  CACHE_TTL,
  DATA_VALUE_RELATIONS,
  GROUP_RELATIONS,
} from '../data.constants';
import { Category } from '../entities/category.entity';
import { DataValue } from '../entities/data_value.entity';
import { Group } from '../entities/group';
import {
  buildDataValuesMap,
  mapRawGroup,
  mapRawGroupToIso,
} from '../transformers/data.transformer';
import { RawDataGroupRow, RawDataValueRow } from '../types/data.types';
import { DataCacheService } from './data-cache.service';

@Injectable()
export class DataQueryService {
  constructor(
    @InjectRepository(DataValue)
    private readonly dataValueRepo: Repository<DataValue>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,

    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    private readonly dataSource: DataSource,
    private readonly dataCache: DataCacheService,
  ) {}

  async findCategoryById(id: number): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async createCategory(category: DeepPartial<Category>): Promise<Category> {
    const savedCategory = await this.categoryRepo.save(category);
    await this.dataCache.clearStats();

    return savedCategory;
  }

  async findSitesByCategoryId(categoryId: number): Promise<Site[]> {
    return this.dataSource
      .getRepository(Site)
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.siteType', 'siteType')
      .distinct(true)
      .innerJoin(Group, 'group', 'group.site_id = site.id')
      .where('group.category_id = :categoryId', { categoryId })
      .getMany();
  }

  async findCategorySites(categoryId: number) {
    return this.dataCache.getOrSet(
      `categories-sites:${categoryId}`,
      CACHE_TTL,
      async () => {
        const [category, sites] = await Promise.all([
          this.findCategoryById(categoryId),
          this.findSitesByCategoryId(categoryId),
        ]);

        return { category, sites };
      },
    );
  }

  async getAllGroup(): Promise<Group[]> {
    return this.groupRepo.find({
      relations: GROUP_RELATIONS,
    });
  }

  async getVariablesByCategory(
    categoryId: number,
    sourceId?: number,
    siteCode?: string,
  ) {
    return this.dataCache.getOrSet(
      `variables:${categoryId}:${sourceId ?? 'all'}:${siteCode ?? 'all'}`,
      CACHE_TTL,
      async () => {
        const sourceQb = this.dataSource
          .getRepository(DataSourceType)
          .createQueryBuilder('source')
          .innerJoin(Group, 'group', 'group.source_id = source.id')
          .innerJoin('group.site', 'site')
          .where('group.category_id = :categoryId', { categoryId })
          .distinct(true);

        if (siteCode) {
          sourceQb.andWhere('site.code = :siteCode', { siteCode });
        }

        const sources = await sourceQb.getMany();

        let effectiveSourceId = sourceId;
        if (effectiveSourceId && sources.length > 0) {
          const isSourceAvailable = sources.some(
            (source) => source.id === effectiveSourceId,
          );

          if (!isSourceAvailable) {
            effectiveSourceId = undefined;
          }
        }

        const qb = this.dataValueRepo
          .createQueryBuilder('dv')
          .innerJoin('dv.variable', 'variable')
          .innerJoin('variable.unit', 'unit')
          .innerJoin('dv.group', 'grp')
          .innerJoin('grp.category', 'category')
          .innerJoin('grp.site', 'site')
          .where('category.id = :categoryId', { categoryId })
          .select([
            'variable.id AS id',
            'variable.name AS name',
            'variable.description AS description',
            'unit.id AS unit_id',
            'unit.name AS unit_name',
            'unit.symbol AS unit_symbol',
            'unit.description AS unit_description',
          ])
          .distinct(true);

        if (effectiveSourceId) {
          qb.andWhere('grp.source_id = :sourceId', {
            sourceId: effectiveSourceId,
          });
        }

        if (siteCode) {
          qb.andWhere('site.code = :siteCode', { siteCode });
        }

        const rawVariables = await qb.getRawMany<{
          id: number;
          name: string;
          description: string | null;
          unit_id: number;
          unit_name: string;
          unit_symbol: string | null;
          unit_description: string | null;
        }>();

        const variables = rawVariables.map((variable) => ({
          id: variable.id,
          name: variable.name,
          description: variable.description,
          unit: {
            id: variable.unit_id,
            name: variable.unit_name,
            symbol: variable.unit_symbol,
            description: variable.unit_description,
          },
        }));

        return { variables, sources };
      },
    );
  }

  async findDataByCategoryId(id: number): Promise<DataValue[]> {
    return this.dataValueRepo.find({
      where: { group: { category: { id } } },
      relations: DATA_VALUE_RELATIONS,
    });
  }

  async findDataByCategoryIdPaginated(
    categoryId: number,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;

    const [groups, total] = await this.groupRepo.findAndCount({
      where: { category: { id: categoryId } },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      relations: GROUP_RELATIONS,
    });

    const groupIds = groups.map((group) => group.id);

    if (groupIds.length === 0) {
      return {
        content: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const dataValues = await this.dataValueRepo.find({
      where: { group: { id: In(groupIds) } },
      relations: DATA_VALUE_RELATIONS,
    });

    const grouped = groups
      .map((group) => ({
        group,
        content: dataValues.filter(
          (dataValue) => dataValue.group.id === group.id,
        ),
      }))
      .filter(({ content }) => content.length > 0);

    return {
      content: grouped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findGroupsByCategoryAndSiteCodeByDate(
    categoryId: number,
    siteCode: string,
    start?: Date,
    end?: Date,
    sourceId?: number,
  ) {
    const effectiveSourceId = await this.getEffectiveSourceId(
      categoryId,
      siteCode,
      sourceId,
    );

    const dateQb = this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.category', 'category')
      .leftJoin('group.site', 'site')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode });

    if (effectiveSourceId) {
      dateQb.andWhere('group.source_id = :effectiveSourceId', {
        effectiveSourceId,
      });
    }

    const allDatesRaw = await dateQb
      .select('MIN(group.date_utc)', 'mindate')
      .addSelect('MAX(group.date_utc)', 'maxdate')
      .getRawOne<{ mindate: string; maxdate: string }>();

    if (!allDatesRaw?.maxdate) return null;

    const allDates = {
      minDate: allDatesRaw.mindate,
      maxDate: allDatesRaw.maxdate,
    };

    const maxDateObj = new Date(allDates.maxDate);
    let startDate = start;
    let endDate = end;

    if (!startDate || !endDate) {
      endDate = maxDateObj;
      const tmp = new Date(endDate);
      tmp.setMonth(tmp.getMonth() - 1);
      startDate = start ?? tmp;
    }

    const qb = this.groupRepo
      .createQueryBuilder('group')
      .select([
        'group.id AS id',
        'group.date_utc AS date_utc',
        'site.code AS site_code',
        'category.id AS category',
        'method.name AS method_name',
        'method.description AS method_description',
        'source.name AS source_name',
        'qcl.name AS qcl_name',
        'qcl.description AS qcl_description',
      ])
      .leftJoin('group.site', 'site')
      .leftJoin('group.category', 'category')
      .leftJoin('group.method', 'method')
      .leftJoin('group.source', 'source')
      .leftJoin('group.qcl', 'qcl')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .andWhere('group.date_utc BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('group.date_utc', 'ASC');

    if (effectiveSourceId) {
      qb.andWhere('group.source_id = :effectiveSourceId', {
        effectiveSourceId,
      });
    }

    const rawGroups = await qb.getRawMany<RawDataGroupRow>();

    if (rawGroups.length === 0) {
      return { groups: [], startDate, endDate, allDates };
    }

    const groupIds = rawGroups.map((group) => Number(group.id));
    const rawDataValues = await this.getRawDataValues(groupIds);
    const valuesMap = buildDataValuesMap(rawDataValues);
    const formattedGroups = rawGroups.map((group) =>
      mapRawGroup(group, valuesMap),
    );

    return { groups: formattedGroups, startDate, endDate, allDates };
  }

  async findGroupsByCategoryAndSiteCodePaginated(
    categoryId: number,
    siteCode: string,
    options: { page?: number; limit?: number; sourceId?: number } = {},
  ) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, options.limit ?? 20);
    const offset = (page - 1) * limit;
    const effectiveSourceId = await this.getEffectiveSourceId(
      categoryId,
      siteCode,
      options.sourceId,
    );
    const cacheKey = `data-paginated:${categoryId}:${siteCode}:${page}:${limit}:${effectiveSourceId ?? 'def'}`;

    return this.dataCache.getOrSet(cacheKey, CACHE_TTL, async () => {
      const qb = this.groupRepo
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.site', 'site')
        .leftJoinAndSelect('site.siteType', 'siteType')
        .leftJoinAndSelect('group.category', 'category')
        .leftJoinAndSelect('group.method', 'method')
        .leftJoinAndSelect('group.source', 'source')
        .leftJoinAndSelect('group.qcl', 'qcl')
        .where('category.id = :categoryId', { categoryId })
        .andWhere('site.code = :siteCode', { siteCode });

      if (effectiveSourceId) {
        qb.andWhere('group.source_id = :effectiveSourceId', {
          effectiveSourceId,
        });
      }

      const [groups, total] = await qb
        .orderBy('group.date_utc', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      if (groups.length === 0) {
        return {
          content: [],
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      }

      const groupIds = groups.map((group) => group.id);
      const dataValues = await this.dataValueRepo.find({
        where: { group: { id: In(groupIds) } },
        relations: ['group', 'variable', 'variable.unit'],
      });

      const content = groups.map((group) => ({
        group,
        values: dataValues
          .filter((dataValue) => dataValue.group.id === group.id)
          .map(({ group, ...dataValueWithoutGroup }) => {
            void group;
            return dataValueWithoutGroup;
          }),
      }));

      return {
        content,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  async findGroupsByCategoryAndSiteCodePaginatedWithDate(
    categoryId: number,
    siteCode: string,
    options: {
      page?: number;
      limit?: number;
      start?: Date;
      end?: Date;
      sourceId?: number;
    } = {},
  ) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, options.limit ?? 20);
    const offset = (page - 1) * limit;
    const effectiveSourceId = await this.getEffectiveSourceId(
      categoryId,
      siteCode,
      options.sourceId,
    );

    const baseQb = this.createCategorySiteGroupsQuery(categoryId, siteCode);
    if (effectiveSourceId) {
      baseQb.andWhere('group.source_id = :effectiveSourceId', {
        effectiveSourceId,
      });
    }

    const allDatesRaw = await baseQb
      .select('MIN(group.date_utc)', 'mindate')
      .addSelect('MAX(group.date_utc)', 'maxdate')
      .getRawOne<{ mindate: string; maxdate: string }>();

    const minDate = allDatesRaw?.mindate
      ? new Date(allDatesRaw.mindate).toISOString()
      : '';
    const maxDate = allDatesRaw?.maxdate
      ? new Date(allDatesRaw.maxdate).toISOString()
      : '';

    const query = this.createCategorySiteGroupsQuery(categoryId, siteCode);
    if (effectiveSourceId) {
      query.andWhere('group.source_id = :effectiveSourceId', {
        effectiveSourceId,
      });
    }

    if (options.start) {
      query.andWhere('group.date_utc >= :start', { start: options.start });
    }
    if (options.end) {
      query.andWhere('group.date_utc <= :end', { end: options.end });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);

    if (total === 0) {
      return {
        statusCode: 200,
        content: [],
        total,
        page,
        limit,
        totalPages,
        minDate,
        maxDate,
      };
    }

    const rawGroups = await query
      .select([
        'group.id AS id',
        'group.date_utc AS date_utc',
        'site.code AS site_code',
        'category.id AS category',
        'method.name AS method_name',
        'method.description AS method_description',
        'source.name AS source_name',
        'qcl.name AS qcl_name',
        'qcl.description AS qcl_description',
      ])
      .leftJoin('group.method', 'method')
      .leftJoin('group.source', 'source')
      .leftJoin('group.qcl', 'qcl')
      .orderBy('group.date_utc', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<RawDataGroupRow>();

    const groupIds = rawGroups.map((group) => Number(group.id));
    const rawDataValues = await this.getRawDataValues(groupIds);
    const valuesMap = buildDataValuesMap(rawDataValues, '');
    const content = rawGroups.map((group) =>
      mapRawGroupToIso(group, valuesMap),
    );

    return {
      statusCode: 200,
      content,
      total,
      page,
      limit,
      totalPages,
      minDate,
      maxDate,
    };
  }

  async findById(id: number): Promise<DataValue | null> {
    return this.dataValueRepo.findOne({
      where: { id },
      relations: DATA_VALUE_RELATIONS,
    });
  }

  async findGroupsByCategoryAndSiteCode(categoryId: number, siteCode: string) {
    const dataValues = await this.dataValueRepo
      .createQueryBuilder('dv')
      .leftJoinAndSelect('dv.group', 'group')
      .leftJoinAndSelect('group.category', 'category')
      .leftJoinAndSelect('group.site', 'site')
      .leftJoinAndSelect('site.siteType', 'siteType')
      .leftJoinAndSelect('group.method', 'method')
      .leftJoinAndSelect('group.source', 'source')
      .leftJoinAndSelect('group.qcl', 'qcl')
      .leftJoinAndSelect('dv.variable', 'variable')
      .leftJoinAndSelect('variable.unit', 'unit')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .getMany();

    const groups = new Map<number, { group: Group; values: DataValue[] }>();

    for (const dataValue of dataValues) {
      const groupId = dataValue.group.id;
      if (!groups.has(groupId)) {
        groups.set(groupId, { group: dataValue.group, values: [] });
      }
      groups.get(groupId)!.values.push(dataValue);
    }

    return Array.from(groups.values());
  }

  private async getEffectiveSourceId(
    categoryId: number,
    siteCode: string,
    requestedSourceId?: number,
  ): Promise<number | undefined> {
    if (requestedSourceId) return requestedSourceId;

    const latestGroup = await this.groupRepo.findOne({
      where: { category: { id: categoryId }, site: { code: siteCode } },
      relations: ['source'],
      order: { date_utc: 'DESC' },
    });

    return latestGroup?.source?.id;
  }

  private createCategorySiteGroupsQuery(categoryId: number, siteCode: string) {
    return this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.category', 'category')
      .leftJoin('group.site', 'site')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode });
  }

  private async getRawDataValues(groupIds: number[]) {
    return this.dataValueRepo
      .createQueryBuilder('dv')
      .select([
        'dv.group_id AS group_id',
        'dv.variable_id AS variable_id',
        'dv.value AS value',
      ])
      .where('dv.group_id IN (:...groupIds)', { groupIds })
      .getRawMany<RawDataValueRow>();
  }
}
