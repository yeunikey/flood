import { Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { UploadChunkPayloadDto } from './dto/upload-chunk.dto';
import { Category } from './entities/category.entity';
import { DataExportService } from './services/data-export.service';
import { DataImportService } from './services/data-import.service';
import { DataQueryService } from './services/data-query.service';
import { DataStatsService } from './services/data-stats.service';

@Injectable()
export class DataService {
  constructor(
    private readonly dataImport: DataImportService,
    private readonly dataQuery: DataQueryService,
    private readonly dataStats: DataStatsService,
    private readonly dataExport: DataExportService,
  ) {}

  deleteGroupsByCategory(categoryId: number) {
    return this.dataImport.deleteGroupsByCategory(categoryId);
  }

  uploadChunk(data: UploadChunkPayloadDto) {
    return this.dataImport.uploadChunk(data);
  }

  findCategoryById(id: number) {
    return this.dataQuery.findCategoryById(id);
  }

  getAllCategories() {
    return this.dataQuery.getAllCategories();
  }

  findSitesByCategoryId(categoryId: number) {
    return this.dataQuery.findSitesByCategoryId(categoryId);
  }

  findAllCategories() {
    return this.dataQuery.findAllCategories();
  }

  findCategorySites(categoryId: number) {
    return this.dataQuery.findCategorySites(categoryId);
  }

  getAllGroup() {
    return this.dataQuery.getAllGroup();
  }

  getStats() {
    return this.dataStats.getStats();
  }

  createCategory(category: DeepPartial<Category>) {
    return this.dataQuery.createCategory(category);
  }

  getVariablesByCategory(
    categoryId: number,
    sourceId?: number,
    siteCode?: string,
  ) {
    return this.dataQuery.getVariablesByCategory(
      categoryId,
      sourceId,
      siteCode,
    );
  }

  findDataByCategoryId(id: number) {
    return this.dataQuery.findDataByCategoryId(id);
  }

  findDataByCategoryIdPaginated(
    categoryId: number,
    options: { page: number; limit: number },
  ) {
    return this.dataQuery.findDataByCategoryIdPaginated(categoryId, options);
  }

  findGroupsByCategoryAndSiteCodeByDate(
    categoryId: number,
    siteCode: string,
    start?: Date,
    end?: Date,
    sourceId?: number,
  ) {
    return this.dataQuery.findGroupsByCategoryAndSiteCodeByDate(
      categoryId,
      siteCode,
      start,
      end,
      sourceId,
    );
  }

  findGroupsByCategoryAndSiteCodePaginated(
    categoryId: number,
    siteCode: string,
    options: { page?: number; limit?: number; sourceId?: number } = {},
  ) {
    return this.dataQuery.findGroupsByCategoryAndSiteCodePaginated(
      categoryId,
      siteCode,
      options,
    );
  }

  findGroupsByCategoryAndSiteCodePaginatedWithDate(
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
    return this.dataQuery.findGroupsByCategoryAndSiteCodePaginatedWithDate(
      categoryId,
      siteCode,
      options,
    );
  }

  findById(id: number) {
    return this.dataQuery.findById(id);
  }

  findGroupsByCategoryAndSiteCode(categoryId: number, siteCode: string) {
    return this.dataQuery.findGroupsByCategoryAndSiteCode(categoryId, siteCode);
  }

  generateCsv(categoryId: number, siteCode: string, start?: Date, end?: Date) {
    return this.dataExport.generateCsv(categoryId, siteCode, start, end);
  }
}
