import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
  ParseIntPipe,
  Delete,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HecRasService } from './hec-ras.service';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const tempUploadDir = join(process.cwd(), 'uploads', 'temp');
if (!existsSync(tempUploadDir)) mkdirSync(tempUploadDir, { recursive: true });

@Controller('hec-ras')
export class HecRasController {
  private readonly logger = new Logger(HecRasController.name);

  constructor(private readonly service: HecRasService) {}

  @Get('')
  getAllProjects() {
    return this.service.getAllProjects();
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: tempUploadDir,
        filename: (req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async uploadProject(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
  ) {
    return this.service.uploadProject(file, name);
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string) {
    await this.service.deleteProject(id);
    return { success: true };
  }

  @Get('map/metadata/:id')
  getMetadata(@Param('id') id: string) {
    return this.service.getMetadata(id);
  }

  @Get('map/times/:id')
  getTimes(@Param('id') id: string) {
    return this.service.getTimes(id);
  }

  @Get('map/tiles/:id/:z/:x/:y.png')
  getTile(
    @Param('id') id: string,
    @Param('z', ParseIntPipe) z: number,
    @Param('x', ParseIntPipe) x: number,
    @Param('y') yStr: string,
    @Query('time') time: string,
    @Query('tms') tms: string,
    @Res() res: Response,
  ) {
    const y = parseInt(yStr.replace('.png', ''), 10);
    const useTms = tms === 'true' || tms === '1';

    try {
      const tile = this.service.getTile(id, z, x, y, time, useTms);

      if (!tile) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Кэшируем пустоту на час
        res.send(this.service.getTransparentTile());
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(tile);
    } catch (error) {
      this.logger.error('Failed to render HEC-RAS tile', error);
      res.setHeader('Content-Type', 'image/png');
      res.send(this.service.getTransparentTile());
    }
  }
}
