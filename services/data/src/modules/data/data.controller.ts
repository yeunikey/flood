import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpStatus,
  Query,
  Inject,
} from '@nestjs/common';

import { DataService } from './data.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('')
export class DataController {
  constructor(
    private readonly dataService: DataService,

    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('category')
  async getAllCategory() {
    return {
      statusCode: 200,
      data: await this.dataService.getAllCategories(),
    };
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

    return {
      statusCode: 200,
      data: results,
    };
  }

  @Get('category/:id/sites')
  async getSitesByCategory(@Param('id') categoryId: number) {
    const cached = await this.cacheManager.get(
      `categories-sites:${categoryId}`,
    );

    if (cached) {
      return cached;
    }

    const [category, sites] = await Promise.all([
      this.dataService.findCategoryById(categoryId),
      this.dataService.findSitesByCategoryId(categoryId),
    ]);

    const result = {
      category,
      sites,
    };

    await this.cacheManager.set(
      `categories-sites:${categoryId}`,
      result,
      60 * 60 * 1000,
    );

    return result;
  }

  @Get('groups')
  async getAllGroups() {
    return {
      statusCode: 200,
      data: await this.dataService.getAllGroup(),
    };
  }

  @Post('category')
  async createCategory(@Body() body: { name: string; description: string }) {
    return {
      statusCode: 200,
      data: await this.dataService.createCategory(body),
    };
  }

  @Get('category/:id/variables')
  async categoryVariables(@Param('id') categoryId: number) {
    const category = await this.dataService.findCategoryById(categoryId);

    if (!category) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Категория не найдена',
      };
    }

    return {
      statusCode: 200,
      data: await this.dataService.getVariablesByCategory(categoryId),
    };
  }

  @Get('category/:id/values')
  async getByCategoryValues(@Param('id') id: number) {
    const result = await this.dataService.findDataByCategoryId(id);

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Get('datavalue/:id')
  async getById(@Param('id') id: number) {
    const result = await this.dataService.findById(id);

    if (!result) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Таких данных не существует',
      };
    }

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Get('category/:id/by-site/:siteCode')
  async getByCategoryAndSiteCode(
    @Param('id') categoryId: number,
    @Param('siteCode') siteCode: string,
  ) {
    const result = await this.dataService.findGroupsByCategoryAndSiteCode(
      categoryId,
      siteCode,
    );

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Get('category/:id/by-site/:siteCode/paginated')
  async getByCategoryAndSiteCodePagniated(
    @Param('id') categoryId: number,
    @Param('siteCode') siteCode: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const result =
      await this.dataService.findGroupsByCategoryAndSiteCodePaginated(
        categoryId,
        siteCode,
        { page: pageNumber, limit: limitNumber },
      );

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Get('category/:id/by-site/:siteCode/by-date')
  async getByCategoryAndSiteCodeByDate(
    @Param('id') categoryId: number,
    @Param('siteCode') siteCode: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const result = await this.dataService.findGroupsByCategoryAndSiteCodeByDate(
      categoryId,
      siteCode,
      start ? new Date(start) : undefined,
      end ? new Date(end) : undefined,
    );

    return {
      statusCode: 200,
      ...result,
    };
  }

  @Get('category/:id/by-site/:siteCode/paginated-date')
  async getByCategoryAndSiteCodePaginatedWithDate(
    @Param('id') categoryId: number,
    @Param('siteCode') siteCode: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const result =
      await this.dataService.findGroupsByCategoryAndSiteCodePaginatedWithDate(
        categoryId,
        siteCode,
        {
          page: pageNumber,
          limit: limitNumber,
          start: start ? new Date(start) : undefined,
          end: end ? new Date(end) : undefined,
        },
      );

    return {
      statusCode: 200,
      data: result,
    };
  }
}
