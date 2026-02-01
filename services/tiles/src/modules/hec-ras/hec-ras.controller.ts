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
  Header,
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
  constructor(private readonly service: HecRasService) {}

  @Get('')
  getAllProjects() {
    return this.service.getAllProjects();
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
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'public, max-age=31536000')
  getTile(
    @Param('id') id: string,
    @Param('z', ParseIntPipe) z: number,
    @Param('x', ParseIntPipe) x: number,
    @Param('y') yStr: string,
    @Query('time') time: string,
    @Res() res: Response,
  ) {
    const y = parseInt(yStr.replace('.png', ''));

    try {
      const tile = this.service.getTile(id, z, x, y, time);

      if (!tile) {
        // Возвращаем прозрачный пиксель 1x1, чтобы браузер не ругался на 404 в консоли
        const transparentPixel = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64',
        );
        res.send(transparentPixel);
        return;
      }

      res.send(tile);
    } catch (e) {
      console.error(e);
      res.status(404).send('Tile not found');
    }
  }
}
