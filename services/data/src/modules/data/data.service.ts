/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, Logger } from '@nestjs/common';
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

  async getVariablesByCategory(categoryId: number) {
    const cached = await this.cacheManager.get(`variables:${categoryId}`);

    if (cached) {
      return cached;
    }

    const rawVariables = await this.dataValueRepo
      .createQueryBuilder('dv')
      .innerJoin('dv.variable', 'variable')
      .innerJoin('variable.unit', 'unit')
      .innerJoin('dv.group', 'grp')
      .innerJoin('grp.category', 'category')
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
      .distinct(true)
      .getRawMany<{
        id: number;
        name: string;
        description: string | null;
        unit_id: number;
        unit_name: string;
        unit_symbol: string | null;
        unit_description: string | null;
      }>();

    const result = rawVariables.map((v) => ({
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

    if (result) {
      await this.cacheManager.set(
        `variables:${categoryId}`,
        result,
        60 * 60 * 1000,
      );
    }

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

  async findGroupsByCategoryAndSiteCodeByDate(
    categoryId: number,
    siteCode: string,
    start?: Date,
    end?: Date,
  ) {
    // Получаем глобальные min/max по всем данным
    const allDates = await this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.category', 'category')
      .leftJoin('group.site', 'site')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .select([
        'MIN(group.date_utc) as "minDate"',
        'MAX(group.date_utc) as "maxDate"',
      ])
      .getRawOne<{ minDate: Date; maxDate: Date }>();

    if (!allDates?.maxDate) {
      return {
        data: {
          content: [],
          start: null,
          end: null,
          minDate: null,
          maxDate: null,
          total: 0,
        },
      };
    }

    // Если даты не заданы → берём последний месяц относительно maxDate
    if (!start || !end) {
      end = allDates.maxDate;
      const tmp = new Date(end);
      tmp.setMonth(tmp.getMonth() - 1);
      start = start ?? tmp;
    }

    // Получаем группы в диапазоне
    const groups = await this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.site', 'site')
      .leftJoinAndSelect('group.category', 'category')
      .leftJoinAndSelect('group.method', 'method')
      .leftJoinAndSelect('group.source', 'source')
      .leftJoinAndSelect('group.qcl', 'qcl')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .andWhere('group.date_utc BETWEEN :start AND :end', { start, end })
      .orderBy('group.date_utc', 'ASC')
      .getMany();

    if (groups.length === 0) {
      return {
        data: {
          content: [],
          start,
          end,
          minDate: allDates.minDate,
          maxDate: allDates.maxDate,
          total: 0,
        },
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

    return {
      data: {
        start,
        end,
        minDate: allDates.minDate,
        maxDate: allDates.maxDate,
        total: groups.length,
        content,
      },
    };
  }

  async findGroupsByCategoryAndSiteCodePaginated(
    categoryId: number,
    siteCode: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, options.limit ?? 20);
    const offset = (page - 1) * limit;

    const cached = await this.cacheManager.get(
      `data-paginated:${categoryId}:${siteCode}:${page}:${limit}`,
    );

    if (cached) {
      return cached;
    }

    const [groups, total] = await this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.site', 'site')
      .leftJoinAndSelect('group.category', 'category')
      .leftJoinAndSelect('group.method', 'method')
      .leftJoinAndSelect('group.source', 'source')
      .leftJoinAndSelect('group.qcl', 'qcl')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .orderBy('group.date_utc', 'ASC')
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
        `data-paginated:${categoryId}:${siteCode}:${page}:${limit}`,
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
    } = {},
  ) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, options.limit ?? 20);
    const offset = (page - 1) * limit;

    const allDates = await this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.category', 'category')
      .leftJoin('group.site', 'site')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode })
      .select([
        'MIN(group.date_utc) as "minDate"',
        'MAX(group.date_utc) as "maxDate"',
      ])
      .getRawOne<{ minDate: Date; maxDate: Date }>();

    const query = this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.site', 'site')
      .leftJoinAndSelect('group.category', 'category')
      .leftJoinAndSelect('group.method', 'method')
      .leftJoinAndSelect('group.source', 'source')
      .leftJoinAndSelect('group.qcl', 'qcl')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('site.code = :siteCode', { siteCode });

    if (options.start) {
      query.andWhere('group.date_utc >= :start', { start: options.start });
    }
    if (options.end) {
      query.andWhere('group.date_utc <= :end', { end: options.end });
    }

    const [groups, total] = await query
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
        minDate: allDates?.minDate || null,
        maxDate: allDates?.maxDate || null,
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

    return {
      content,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      minDate: allDates?.minDate || null,
      maxDate: allDates?.maxDate || null,
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

  // async loadDataValues(data: DataValue[][]) {
  //     const results: DataValue[][] = [];

  //     for (const groupItems of data) {
  //         const group = await this.groupRepo.save({});

  //         const groupResults: DataValue[] = [];

  //         for (const item of groupItems) {
  //             const qcl = await this.qclRepo.findOne({ where: { name: item.qcl.name } }) ??
  //                 await this.qclRepo.save(item.qcl);

  //             const category = await this.categoryRepo.findOne({ where: { name: item.category.name } }) ??
  //                 await this.categoryRepo.save(item.category);

  //             const unit = await this.unitRepo.findOne({ where: { name: item.catalog.variable.unit.name } }) ??
  //                 await this.unitRepo.save(item.catalog.variable.unit);

  //             const variable = await this.variableRepo.findOne({ where: { name: item.catalog.variable.name } }) ??
  //                 await this.variableRepo.save({
  //                     name: item.catalog.variable.name,
  //                     description: item.catalog.variable.description,
  //                     unit: unit
  //                 });

  //             const method = await this.methodRepo.findOne({ where: { name: item.catalog.method.name } }) ??
  //                 await this.methodRepo.save(item.catalog.method);

  //             const source = await this.sourceRepo.findOne({ where: { name: item.catalog.source.name } }) ??
  //                 await this.sourceRepo.save(item.catalog.source);

  //             const siteType = await this.siteTypeRepo.findOne({ where: { name: item.catalog.site.siteType.name } }) ??
  //                 await this.siteTypeRepo.save(item.catalog.site.siteType);

  //             const site = await this.siteRepo.findOne({ where: { code: item.catalog.site.code } }) ??
  //                 await this.siteRepo.save({
  //                     ...item.catalog.site,
  //                     siteType
  //                 });

  //             const catalog = await this.catalogRepo.save({ site, variable, method, source });

  //             const savedValue = await this.dataValueRepo.save({
  //                 catalog,
  //                 category,
  //                 date_utc: item.date_utc,
  //                 value: item.value,
  //                 qcl,
  //                 group
  //             });

  //             groupResults.push(savedValue);
  //         }

  //         results.push(groupResults);
  //     }

  //     return results;
  // }
}
