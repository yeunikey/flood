import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SpatialService } from './spatial.service';
import { CreateSpatialDto } from './dto/create-spatial.dto';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Controller('spatial')
@UseGuards(AuthGuard)
export class SpatialController {
  constructor(private readonly spatialService: SpatialService) {}

  @Post()
  @UseGuards(EditorGuard)
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

  @Get('stats')
  async getStats() {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.getStats(),
    };
  }

  @Get('summary')
  async getSummaryList() {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.getSummaryList(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.findOne(id),
    };
  }

  @Delete(':id')
  @UseGuards(EditorGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.remove(id),
    };
  }

  @Post(':id')
  @UseGuards(EditorGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpatialDto: CreateSpatialDto,
  ) {
    return {
      status: HttpStatus.OK,
      data: await this.spatialService.update(id, updateSpatialDto),
    };
  }
}
