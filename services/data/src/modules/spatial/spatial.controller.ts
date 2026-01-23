import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { SpatialService } from './spatial.service';
import { CreateSpatialDto } from './dto/create-spatial.dto';

@Controller('spatial')
export class SpatialController {
  constructor(private readonly spatialService: SpatialService) {}

  @Post()
  async create(@Body() createSpatialDto: CreateSpatialDto) {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.create(createSpatialDto),
    };
  }

  @Get()
  async findAll() {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.findAll(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.findOne(id),
    };
  }
}
