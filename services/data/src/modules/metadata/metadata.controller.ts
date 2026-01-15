import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  // ---------- Sources ----------
  @Get('sources')
  async findAllSources() {
    return this.metadataService.findAllSources();
  }

  @Post('sources')
  async saveSource(@Body() body: { name: string }) {
    return this.metadataService.saveSource(body);
  }

  @Delete('sources/:id')
  async removeSource(@Param('id', ParseIntPipe) id: number) {
    return this.metadataService.removeSource(id);
  }

  // ---------- Methods ----------
  @Get('methods')
  async findAllMethods() {
    return this.metadataService.findAllMethods();
  }

  @Post('methods')
  async saveMethod(@Body() body: { name: string; description?: string }) {
    return this.metadataService.saveMethod(body);
  }

  @Delete('methods/:id')
  async removeMethod(@Param('id', ParseIntPipe) id: number) {
    return this.metadataService.removeMethod(id);
  }

  // ---------- QCL ----------
  @Get('qcls')
  async findAllQcls() {
    return this.metadataService.findAllQcls();
  }

  @Post('qcls')
  async saveQcl(@Body() body: { name?: string; description?: string }) {
    return this.metadataService.saveQcl(body);
  }

  @Delete('qcls/:id')
  async removeQcl(@Param('id', ParseIntPipe) id: number) {
    return this.metadataService.removeQcl(id);
  }
}
