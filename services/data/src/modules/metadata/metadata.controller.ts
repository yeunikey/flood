import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Controller('metadata')
@UseGuards(AuthGuard)
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  // ---------- Sources ----------
  @Get('sources')
  async findAllSources() {
    return this.metadataService.findAllSources();
  }

  @Post('sources')
  @UseGuards(EditorGuard)
  async saveSource(@Body() body: { name: string }) {
    return this.metadataService.saveSource(body);
  }

  @Delete('sources/:id')
  @UseGuards(EditorGuard)
  async removeSource(@Param('id', ParseIntPipe) id: number) {
    return this.metadataService.removeSource(id);
  }

  // ---------- Methods ----------
  @Get('methods')
  async findAllMethods() {
    return this.metadataService.findAllMethods();
  }

  @Post('methods')
  @UseGuards(EditorGuard)
  async saveMethod(@Body() body: { name: string; description?: string }) {
    return this.metadataService.saveMethod(body);
  }

  @Delete('methods/:id')
  @UseGuards(EditorGuard)
  async removeMethod(@Param('id', ParseIntPipe) id: number) {
    return this.metadataService.removeMethod(id);
  }

  // ---------- QCL ----------
  @Get('qcls')
  async findAllQcls() {
    return this.metadataService.findAllQcls();
  }

  @Post('qcls')
  @UseGuards(EditorGuard)
  async saveQcl(@Body() body: { name?: string; description?: string }) {
    return this.metadataService.saveQcl(body);
  }

  @Delete('qcls/:id')
  @UseGuards(EditorGuard)
  async removeQcl(@Param('id', ParseIntPipe) id: number) {
    return this.metadataService.removeQcl(id);
  }
}
