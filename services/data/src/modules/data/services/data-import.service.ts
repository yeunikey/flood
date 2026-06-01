import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { DataSource as DataSourceType } from '../../metadata/entities/data_source.entity';
import { MethodType } from '../../metadata/entities/method_type.entity';
import { Qcl } from '../../metadata/entities/qcl.entity';
import { Site } from '../../sites/entities/site';
import { Variable } from '../../variable/entities/variable.entity';
import { UploadChunkPayloadDto } from '../dto/upload-chunk.dto';
import { Category } from '../entities/category.entity';
import { DataValue } from '../entities/data_value.entity';
import { Group } from '../entities/group';
import { DataCacheService } from './data-cache.service';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    @InjectRepository(DataValue)
    private readonly dataValueRepo: Repository<DataValue>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,

    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,

    @InjectRepository(MethodType)
    private readonly methodRepo: Repository<MethodType>,

    @InjectRepository(DataSourceType)
    private readonly sourceRepo: Repository<DataSourceType>,

    @InjectRepository(Qcl)
    private readonly qclRepo: Repository<Qcl>,

    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    private readonly dataSource: DataSource,
    private readonly dataCache: DataCacheService,
  ) {}

  async deleteGroupsByCategory(categoryId: number): Promise<void> {
    try {
      await this.groupRepo.query(`SET session_replication_role = replica`);

      while (true) {
        const deleted: unknown = await this.groupRepo.query(
          `
          DELETE FROM "group"
          WHERE id IN (
              SELECT id FROM "group"
              WHERE category_id = $1
              LIMIT 5000
          )
          RETURNING id
          `,
          [categoryId],
        );

        const rowCount = Array.isArray(deleted) ? deleted.length : 0;
        if (rowCount === 0) break;
      }
    } finally {
      await this.groupRepo.query(`SET session_replication_role = DEFAULT`);
    }

    await this.dataCache.clearStats();
    this.logger.log(`Deleted groups for category ${categoryId}`);
  }

  async uploadChunk(data: UploadChunkPayloadDto): Promise<boolean | void> {
    const [qcl, source, method, category] = await Promise.all([
      this.qclRepo.findOneBy({ id: data.qclId }),
      this.sourceRepo.findOneBy({ id: data.sourceId }),
      this.methodRepo.findOneBy({ id: data.methodId }),
      this.categoryRepo.findOneBy({ id: data.categoryId }),
    ]);

    if (!qcl || !source || !method || !category) return false;

    const siteIds = data.chunks.map((chunk) => chunk.siteId);
    const variableIds = data.chunks
      .flatMap((chunk) => chunk.variables)
      .filter(Boolean) as number[];

    const [sites, variables] = await Promise.all([
      this.siteRepo.findBy({ id: In(siteIds) }),
      this.variableRepo.findBy({ id: In(variableIds) }),
    ]);

    const siteMap = new Map(sites.map((site) => [site.id, site]));
    const variableMap = new Map(
      variables.map((variable) => [variable.id, variable]),
    );

    const result = await this.dataSource.transaction(async (manager) => {
      const chunksWithGroups = data.chunks.flatMap((chunk) => {
        const site = siteMap.get(chunk.siteId);

        if (!site) {
          return [];
        }

        return [
          {
            chunk,
            group: {
              date_utc: new Date(chunk.date_utc),
              category,
              site,
              method,
              source,
              qcl,
            },
          },
        ];
      });

      const groups = await manager
        .getRepository(Group)
        .save(chunksWithGroups.map(({ group }) => group));

      const valuesToInsert: Partial<DataValue>[] = [];

      chunksWithGroups.forEach(({ chunk }, index) => {
        const group = groups[index];
        if (!group) return;

        chunk.variables.forEach((variableId, valueIndex) => {
          const value = chunk.values[valueIndex];

          if (value == undefined || value == '') return;
          if (!variableId) return;

          const variable = variableMap.get(variableId);
          if (!variable) return;

          valuesToInsert.push({
            value: value as string,
            group,
            variable,
          });
        });
      });

      if (valuesToInsert.length) {
        await manager.getRepository(DataValue).insert(valuesToInsert);
      }
    });

    await this.dataCache.clearStats();

    return result;
  }
}
