import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { DataService } from './data.service';
import { encodeGetResponse, encodePaginatedResponse } from './proto/data.pb';
import type { Response } from 'express';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CategoryVariablesQueryDto,
  DatePaginationQueryDto,
  PaginationQueryDto,
} from './dto/data-query.dto';
import { ExportCsvDto } from './dto/export-csv.dto';
import { message, ok } from 'src/shared/utils/api-response';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Controller('')
@UseGuards(AuthGuard)
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('category')
  async getAllCategory() {
    return ok(await this.dataService.getAllCategories());
  }

  @Get('category/sites')
  async getAllCategoriesWithSites() {
    const categories = await this.dataService.findAllCategories();

    const results = await Promise.all(
      categories.map(async (category) => {
        const sites = await this.dataService.findSitesByCategoryId(category.id);
        return {
          category,
          sites,
        };
      }),
    );

    return ok(results);
  }

  @Get('category/:id/sites')
  async getSitesByCategory(@Param('id', ParseIntPipe) categoryId: number) {
    return this.dataService.findCategorySites(categoryId);
  }

  @Get('groups')
  async getAllGroups() {
    return ok(await this.dataService.getAllGroup());
  }

  @Get('stats')
  async getStats() {
    return ok(await this.dataService.getStats());
  }

  @Post('category')
  @UseGuards(EditorGuard)
  async createCategory(@Body() body: CreateCategoryDto) {
    return ok(await this.dataService.createCategory(body));
  }

  @Get('category/:id/variables')
  async categoryVariables(
    @Param('id', ParseIntPipe) categoryId: number,
    @Query() query: CategoryVariablesQueryDto,
  ) {
    const category = await this.dataService.findCategoryById(categoryId);

    if (!category) {
      return message('Категория не найдена', HttpStatus.NOT_FOUND);
    }

    return ok(
      await this.dataService.getVariablesByCategory(
        categoryId,
        query.sourceId,
        query.siteCode,
      ),
    );
  }

  @Get('category/:id/values')
  async getByCategoryValues(@Param('id', ParseIntPipe) id: number) {
    const result = await this.dataService.findDataByCategoryId(id);

    return ok(result);
  }

  @Get('datavalue/:id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.dataService.findById(id);

    if (!result) {
      return message('Таких данных не существует', HttpStatus.NOT_FOUND);
    }

    return ok(result);
  }

  @Get('category/:id/by-site/:siteCode')
  async getByCategoryAndSiteCode(
    @Param('id', ParseIntPipe) categoryId: number,
    @Param('siteCode') siteCode: string,
  ) {
    const result = await this.dataService.findGroupsByCategoryAndSiteCode(
      categoryId,
      siteCode,
    );

    return ok(result);
  }

  @Get('category/:id/by-site/:siteCode/paginated')
  async getByCategoryAndSiteCodePagniated(
    @Param('id', ParseIntPipe) categoryId: number,
    @Param('siteCode') siteCode: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result =
      await this.dataService.findGroupsByCategoryAndSiteCodePaginated(
        categoryId,
        siteCode,
        {
          page: query.page,
          limit: query.limit,
          sourceId: query.sourceId,
        },
      );

    return ok(result);
  }

  @Get('category/:id/by-site/:siteCode/by-date')
  @Header('Content-Type', 'application/x-proto')
  async getByCategoryAndSiteCodeByDate(
    @Param('id', ParseIntPipe) categoryId: number,
    @Param('siteCode') siteCode: string,
    @Query() query: DatePaginationQueryDto,
  ) {
    const result = await this.dataService.findGroupsByCategoryAndSiteCodeByDate(
      categoryId,
      siteCode,
      query.start ? new Date(query.start) : undefined,
      query.end ? new Date(query.end) : undefined,
      query.sourceId,
    );

    if (!result) {
      throw new NotFoundException();
    }

    const payload = {
      statusCode: 200,
      groups: result.groups.map((group) => ({
        ...group,
        date_utc: group.date_utc.toISOString(),
      })),
      startDate: result.startDate?.toISOString() ?? '',
      endDate: result.endDate?.toISOString() ?? '',
      allDates: {
        minDate: new Date(result.allDates.minDate).toISOString(),
        maxDate: new Date(result.allDates.maxDate).toISOString(),
      },
    };

    return new StreamableFile(encodeGetResponse(payload));
  }

  @Get('category/:id/by-site/:siteCode/paginated-date')
  @Header('Content-Type', 'application/x-proto')
  async getByCategoryAndSiteCodePaginatedWithDate(
    @Param('id', ParseIntPipe) categoryId: number,
    @Param('siteCode') siteCode: string,
    @Query() query: DatePaginationQueryDto,
  ) {
    const payload =
      await this.dataService.findGroupsByCategoryAndSiteCodePaginatedWithDate(
        categoryId,
        siteCode,
        {
          page: query.page,
          limit: query.limit,
          start: query.start ? new Date(query.start) : undefined,
          end: query.end ? new Date(query.end) : undefined,
          sourceId: query.sourceId,
        },
      );

    if (!payload) {
      throw new NotFoundException();
    }

    return new StreamableFile(encodePaginatedResponse(payload));
  }

  @Post('category/:id/export/csv')
  async exportCsv(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() body: ExportCsvDto,
    @Res() res: Response,
  ) {
    const csvData = await this.dataService.generateCsv(
      categoryId,
      body.siteCode,
      body.startDate ? new Date(body.startDate) : undefined,
      body.endDate ? new Date(body.endDate) : undefined,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=export_${body.siteCode}.csv`,
    );
    res.send(csvData);
  }
}
