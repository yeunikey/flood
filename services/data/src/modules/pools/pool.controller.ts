import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { PoolService } from './pool.service';
import { PoolCreateDto } from './dto/pool-create.dto';
import { PoolUpdateDto } from './dto/pool-update.dto';

@Controller('pools')
export class PoolController {
  constructor(private poolService: PoolService) {}

  @Get()
  async getAll() {
    return {
      statusCode: 200,
      data: await this.poolService.findAll(),
    };
  }

  @Post('create')
  async create(@Body() body: PoolCreateDto) {
    const pool = await this.poolService.create(
      body.name,
      body.geojson,
      body.siteIds,
    );

    return {
      statusCode: 201,
      message: 'Бассейн создан',
      data: pool,
    };
  }

  @Post('update')
  async update(@Query('pool_id') pool_id: number, @Body() body: PoolUpdateDto) {
    const pool = await this.poolService.findById(Number(pool_id));
    if (!pool) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Бассейн не найден',
      };
    }

    const updated = await this.poolService.update(
      pool,
      body.name,
      body.geojson,
      body.siteIds,
    );

    return {
      statusCode: 200,
      data: updated,
    };
  }

  @Get('delete')
  async delete(@Query('pool_id') pool_id: number) {
    const pool = await this.poolService.findById(Number(pool_id));
    if (!pool) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Бассейн не найден',
      };
    }

    await this.poolService.delete(pool);

    return { statusCode: 200 };
  }
}
