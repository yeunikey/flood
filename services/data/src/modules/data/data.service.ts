/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { DataValue } from './entities/data_value.entity';
import { MethodType } from '../metadata/entities/method_type.entity';
import { Qcl } from '../metadata/entities/qcl.entity';
import { Unit } from '../variable/entities/unit.entity';
import { Variable } from '../variable/entities/variable.entity';
import { DataSource as DataSourceType } from '../metadata/entities/data_source.entity';
import { Group } from './entities/group';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Site } from '../sites/entities/site';
import { SiteType } from '../sites/entities/site_type';

interface ByDateResponse {
  data: {
    content: {
      group: Group;
      values: {
        id: number;
        value: string;
        variable: Variable;
      }[];
    }[];
    start: Date | null;
    end: Date | null;
    minDate: Date | null;
    maxDate: Date | null;
    total: number;
  };
}

interface DataRowDto {
  date_utc: string;
  siteId: number;
  variables: (number | null)[];
  values: any[];
}

interface UploadChunkPayloadDto {
  qclId: number;
  sourceId: number;
  methodId: number;
  categoryId: number;

  chunks: DataRowDto[];
}

export interface PaginatedResult<T> {
  content: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(DataValue)
    private dataValueRepo: Repository<DataValue>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(Site)
    private siteRepo: Repository<Site>,

    @InjectRepository(SiteType)
    private siteTypeRepo: Repository<SiteType>,

    @InjectRepository(Variable)
    private variableRepo: Repository<Variable>,

    @InjectRepository(Unit)
    private unitRepo: Repository<Unit>,

    @InjectRepository(MethodType)
    private methodRepo: Repository<MethodType>,

    @InjectRepository(DataSourceType)
    private sourceRepo: Repository<DataSourceType>,

    @InjectRepository(Qcl)
    private qclRepo: Repository<Qcl>,

    @InjectRepository(Group)
    private groupRepo: Repository<Group>,

    private dataSource: DataSource,

    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  private readonly logger = new Logger(DataService.name);

  async deleteGroupsByCategory(categoryId: number) {
    await this.groupRepo.query(`SET session_replication_role = replica`);

    while (true) {
      const deleted = await this.groupRepo.query(
        `
        DELETE FROM "group"
        WHERE id IN (
            SELECT id FROM "group"
            WHERE category_id = $1
            LIMIT 5000
        )
    `,
        [categoryId],
      );

      if (deleted.rowCount === 0) break;
    }

    await this.groupRepo.query(`SET session_replication_role = DEFAULT`);

    console.log('Удаление завершено');
  }

  async uploadChunk(data: UploadChunkPayloadDto) {
    const [qcl, source, method, category] = await Promise.all([
      this.qclRepo.findOneBy({ id: data.qclId }),
      this.sourceRepo.findOneBy({ id: data.sourceId }),
      this.methodRepo.findOneBy({ id: data.methodId }),
      this.categoryRepo.findOneBy({ id: data.categoryId }),
    ]);
    if (!qcl || !source || !method || !category) return false;

    const siteIds = data.chunks.map((c) => c.siteId);
    const variableIds = data.chunks
      .flatMap((c) => c.variables)
      .filter(Boolean) as number[];

    const [sites, variables] = await Promise.all([
      this.siteRepo.findBy({ id: In(siteIds) }),
      this.variableRepo.findBy({ id: In(variableIds) }),
    ]);

    const siteMap = new Map(sites.map((s) => [s.id, s]));
    const variableMap = new Map(variables.map((v) => [v.id, v]));

    return this.dataSource.transaction(async (manager) => {
      const groupsToInsert = data.chunks
        .map((chunk) => ({
          date_utc: new Date(chunk.date_utc),
          category,
          site: siteMap.get(chunk.siteId),
          method,
          source,
          qcl,
        }))
        .filter((g) => g.site);

      const groups = await manager.getRepository(Group).save(groupsToInsert);

      const valuesToInsert: Partial<DataValue>[] = [];

      data.chunks.forEach((chunk, i) => {
        const group = groups[i];
        if (!group) return;

        chunk.variables.forEach((variableId, j) => {
          if (chunk.values[j] == undefined || chunk.values[j] == '') {
            return;
          }

          if (!variableId) return;
          const variable = variableMap.get(variableId);
          if (!variable) return;

          valuesToInsert.push({
            value: chunk.values[j],
            group,
            variable,
          });
        });
      });

      if (valuesToInsert.length) {
        await manager.getRepository(DataValue).insert(valuesToInsert);
      }
    });
  }

  async findCategoryById(id: number) {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async getAllCategories() {
    return this.categoryRepo.find();
  }

  async findSitesByCategoryId(categoryId: number): Promise<Site[]> {
    return await this.dataSource
      .getRepository(Site)
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.siteType', 'siteType')
      .distinct(true)
      .innerJoin(Group, 'group', 'group.site_id = site.id')
      .where('group.category_id = :categoryId', { categoryId })
      .getMany();
  }

  async findAllCategories(): Promise<Category[]> {
    return await this.dataSource.getRepository(Category).find();
  }

  async getAllGroup() {
    return this.groupRepo.find();
  }

  async createCategory(category: DeepPartial<Category>) {
    return this.categoryRepo.save(category);
  }

  async getVariablesByCategory(
    categoryId: number,
    sourceId?: number,
    siteCode?: string,
  ) {
    const cacheKey = `variables:${categoryId}:${sourceId ?? 'all'}:${siteCode ?? 'all'}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      return cached;
    }

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
      const isSourceAvailable = sources.some((s) => s.id === effectiveSourceId);
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
      qb.andWhere('grp.source_id = :sourceId', { sourceId: effectiveSourceId });
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

    const variables = rawVariables.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      unit: {
        id: v.unit_id,
        name: v.unit_name,
        symbol: v.unit_symbol,
        description: v.unit_description,
      },
    }));

    const result = { variables, sources };

    await this.cacheManager.set(cacheKey, result, 60 * 60 * 1000);

    return result;
  }

  async findDataByCategoryId(id: number): Promise<DataValue[]> {
    return this.dataValueRepo.find({
      where: { group: { category: { id } } },
      relations: ['group'],
    });
  }

  async findDataByCategoryIdPaginated(
    categoryId: number,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;

    // пагинируем группы только по категории
    const [groups, total] = await this.groupRepo.findAndCount({
      where: { category: { id: categoryId } },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
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
      relations: [
        'variable',
        'variable.unit',
        'group',
        'group.site',
        'group.category',
      ],
    });

    const grouped = groups
      .map((group) => ({
        group,
        content: dataValues.filter((dv) => dv.group.id === group.id),
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

    console.log(allDates);

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

    const rawGroups = await qb.getRawMany<Record<string, unknown>>();

    if (rawGroups.length === 0) {
      return { groups: [], startDate, endDate, allDates };
    }

    const groupIds = rawGroups.map((g) => Number(g.id));

    const rawDataValues = await this.dataValueRepo
      .createQueryBuilder('dv')
      .select([
        'dv.group_id AS group_id',
        'dv.variable_id AS variable_id',
        'dv.value AS value',
      ])
      .where('dv.group_id IN (:...groupIds)', { groupIds })
      .getRawMany<{ group_id: number; variable_id: number; value: string }>();

    const valuesMap = new Map<
      number,
      { variables: number[]; values: string[] }
    >();

    for (const dv of rawDataValues) {
      const gId = dv.group_id;
      if (!valuesMap.has(gId)) {
        valuesMap.set(gId, { variables: [], values: [] });
      }
      const entry = valuesMap.get(gId);
      if (entry) {
        entry.variables.push(dv.variable_id);
        entry.values.push(dv.value);
      }
    }

    const formattedGroups = rawGroups.map((g) => {
      const dvData = valuesMap.get(Number(g.id)) ?? {
        variables: [],
        values: [],
      };

      return {
        id: Number(g.id),
        date_utc: new Date(g.date_utc as string | Date),
        category: Number(g.category),
        site_code: typeof g.site_code === 'string' ? g.site_code : '',
        method: {
          name: typeof g.method_name === 'string' ? g.method_name : '',
          description:
            typeof g.method_description === 'string'
              ? g.method_description
              : '',
        },
        source: {
          name: typeof g.source_name === 'string' ? g.source_name : '',
        },
        qcl: {
          name: typeof g.qcl_name === 'string' ? g.qcl_name : '',
          description:
            typeof g.qcl_description === 'string' ? g.qcl_description : '',
        },
        variables: dvData.variables,
        values: dvData.values,
      };
    });

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

    const cached = await this.cacheManager.get(
      `data-paginated:${categoryId}:${siteCode}:${page}:${limit}:${effectiveSourceId ?? 'def'}`,
    );

    if (cached) {
      return cached;
    }

    const qb = this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.site', 'site')
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

    const groupIds = groups.map((g) => g.id);
    const dataValues = await this.dataValueRepo.find({
      where: { group: { id: In(groupIds) } },
      relations: ['variable', 'variable.unit'],
    });

    const content = groups.map((group) => ({
      group,
      values: dataValues
        .filter((dv) => dv.group.id === group.id)
        .map(({ group: _, ...dvWithoutGroup }) => dvWithoutGroup),
    }));

    const result = {
      content,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    if (result) {
      await this.cacheManager.set(
        `data-paginated:${categoryId}:${siteCode}:${page}:${limit}:${effectiveSourceId ?? 'def'}`,
        result,
        60 * 60 * 1000,
      );
    }

    return result;
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

    const baseQb = this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.category', 'category')
      .leftJoin('group.site', 'site')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode });

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

    const query = this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.category', 'category')
      .leftJoin('group.site', 'site')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode });

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
      .getRawMany<Record<string, unknown>>();

    const groupIds = rawGroups.map((g) => Number(g.id));

    const rawDataValues = await this.dataValueRepo
      .createQueryBuilder('dv')
      .select([
        'dv.group_id AS group_id',
        'dv.variable_id AS variable_id',
        'dv.value AS value',
      ])
      .where('dv.group_id IN (:...groupIds)', { groupIds })
      .getRawMany<{ group_id: number; variable_id: number; value: string }>();

    const valuesMap = new Map<
      number,
      { variables: number[]; values: string[] }
    >();

    for (const dv of rawDataValues) {
      const gId = dv.group_id;
      if (!valuesMap.has(gId)) {
        valuesMap.set(gId, { variables: [], values: [] });
      }
      const entry = valuesMap.get(gId);
      if (entry) {
        entry.variables.push(dv.variable_id);
        entry.values.push(dv.value ?? '');
      }
    }

    const content = rawGroups.map((g) => {
      const dvData = valuesMap.get(Number(g.id)) ?? {
        variables: [],
        values: [],
      };

      return {
        id: Number(g.id),
        date_utc: new Date(g.date_utc as string | Date).toISOString(),
        category: Number(g.category),
        site_code: typeof g.site_code === 'string' ? g.site_code : '',
        method: {
          name: typeof g.method_name === 'string' ? g.method_name : '',
          description:
            typeof g.method_description === 'string'
              ? g.method_description
              : '',
        },
        source: {
          name: typeof g.source_name === 'string' ? g.source_name : '',
        },
        qcl: {
          name: typeof g.qcl_name === 'string' ? g.qcl_name : '',
          description:
            typeof g.qcl_description === 'string' ? g.qcl_description : '',
        },
        variables: dvData.variables,
        values: dvData.values,
      };
    });

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
    });
  }

  async findGroupsByCategoryAndSiteCode(categoryId: number, siteCode: string) {
    const dataValues = await this.dataValueRepo
      .createQueryBuilder('dv')
      .leftJoinAndSelect('dv.group', 'group')
      .leftJoinAndSelect('group.category', 'category')
      .leftJoinAndSelect('group.site', 'site')
      .leftJoinAndSelect('dv.variable', 'variable')
      .leftJoinAndSelect('variable.unit', 'unit')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .getMany();

    const groups = new Map<number, { group: Group; values: DataValue[] }>();

    for (const dv of dataValues) {
      const gid = dv.group.id;
      if (!groups.has(gid)) {
        groups.set(gid, { group: dv.group, values: [] });
      }
      groups.get(gid)!.values.push(dv);
    }

    return Array.from(groups.values());
  }

  async generateCsv(
    categoryId: number,
    siteCode: string,
    start?: Date,
    end?: Date,
  ): Promise<string> {
    const result = await this.findGroupsByCategoryAndSiteCodeByDate(
      categoryId,
      siteCode,
      start,
      end,
    );

    if (!result || !result.groups.length) {
      return '';
    }

    const groups = result.groups;
    const variableIdsSet = new Set<number>();

    groups.forEach((g) => {
      g.variables.forEach((vid) => variableIdsSet.add(vid));
    });

    const variableIds = Array.from(variableIdsSet);
    if (variableIds.length === 0) {
      return 'Date UTC\n';
    }

    const variables = await this.variableRepo.find({
      where: { id: In(variableIds) },
      relations: ['unit'],
    });

    const variableMap = new Map(
      variables.map((v) => [v.id, `${v.name} [${v.unit?.symbol ?? ''}]`]),
    );

    const header = [
      'Date UTC',
      ...variableIds.map((id) => variableMap.get(id) ?? `Var_${id}`),
    ].join(',');

    const rows = groups.map((group) => {
      const date =
        group.date_utc instanceof Date
          ? group.date_utc.toISOString()
          : new Date(group.date_utc).toISOString();

      const rowValues = variableIds.map((vid) => {
        const idx = group.variables.indexOf(vid);
        return idx !== -1 ? group.values[idx] : '';
      });

      return [date, ...rowValues].join(',');
    });

    return [header, ...rows].join('\n');
  }

  // async generateCsv(
  //   categoryId: number,
  //   siteCode: string,
  //   start?: Date,
  //   end?: Date,
  // ): Promise<string> {
  //   const { data } = await this.findGroupsByCategoryAndSiteCodeByDate(
  //     categoryId,
  //     siteCode,
  //     start,
  //     end,
  //   );

  //   if (!data.content.length) {
  //     return '';
  //   }

  //   const variableMap = new Map<number, string>();
  //   data.content.forEach((row) => {
  //     row.values.forEach((v) => {
  //       variableMap.set(
  //         v.variable.id,
  //         `${v.variable.name} [${v.variable.unit.symbol}]`,
  //       );
  //     });
  //   });

  //   const variableIds = Array.from(variableMap.keys());
  //   const header = ['Date UTC', ...Array.from(variableMap.values())].join(',');

  //   const rows = data.content.map((row) => {
  //     const date =
  //       row.group.date_utc instanceof Date
  //         ? row.group.date_utc.toISOString()
  //         : new Date(row.group.date_utc).toISOString();

  //     const values = variableIds.map((vid) => {
  //       const found = row.values.find((v) => v.variable.id === vid);
  //       return found ? found.value : '';
  //     });

  //     return [date, ...values].join(',');
  //   });

  //   return [header, ...rows].join('\n');
  // }
}
