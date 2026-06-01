import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Variable } from '../../variable/entities/variable.entity';
import { DataQueryService } from './data-query.service';

@Injectable()
export class DataExportService {
  constructor(
    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,
    private readonly dataQuery: DataQueryService,
  ) {}

  async generateCsv(
    categoryId: number,
    siteCode: string,
    start?: Date,
    end?: Date,
  ): Promise<string> {
    const result = await this.dataQuery.findGroupsByCategoryAndSiteCodeByDate(
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

    groups.forEach((group) => {
      group.variables.forEach((variableId) => variableIdsSet.add(variableId));
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
      variables.map((variable) => [
        variable.id,
        `${variable.name} [${variable.unit?.symbol ?? ''}]`,
      ]),
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

      const rowValues = variableIds.map((variableId) => {
        const index = group.variables.indexOf(variableId);
        return index !== -1 ? group.values[index] : '';
      });

      return [date, ...rowValues].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
