/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Get,
  Body,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { TilesService } from './tiles.service';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { TileserverManagerService } from './tileserver.manager';
import { Request } from 'express';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// DTO с валидацией и трансформацией
export class CreateTileDto {
  @IsOptional()
  @IsUUID('4', { message: 'tileUUID должен быть валидным UUID v4' })
  tileUUID?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;
}

// Интерфейс для Multer (так как req.body там еще any)
interface MulterRequest extends Request {
  body: Partial<CreateTileDto>;
}

@Controller('')
export class TilesController {
  constructor(
    private readonly tilesService: TilesService,
    private readonly tileserverManager: TileserverManagerService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'geo', maxCount: 1 }], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const baseDir =
            process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
          const geoDir = join(baseDir, 'geo');

          if (!existsSync(geoDir)) mkdirSync(geoDir, { recursive: true });

          cb(null, geoDir);
        },
        filename: (req: MulterRequest, file, cb) => {
          // Если UUID не пришел с фронта, генерируем его здесь
          if (!req.body.tileUUID) {
            req.body.tileUUID = uuidv4();
          }

          const id = req.body.tileUUID;
          const ext = extname(file.originalname) || '.json';

          cb(null, `${id}${ext}`);
        },
      }),
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async upload(
    @UploadedFiles() files: { geo?: Express.Multer.File[] },
    @Body() body: CreateTileDto,
  ) {
    const id = body.tileUUID;
    const geoFile = files.geo?.[0];

    if (!geoFile) {
      throw new Error('GeoJSON file is required');
    }

    if (!id) {
      throw new Error('Internal Server Error: UUID was not generated');
    }

    // Передаем только нужные поля
    const tile = await this.tilesService.createFromGeoJson(
      { path: geoFile.path, filename: geoFile.filename },
      {
        id,
        name: body.name,
      },
    );

    this.tileserverManager.restartTileserver();

    return {
      status: 'success',
      uuid: tile.id,
      message: 'Tile processed and saved',
    };
  }

  @Get()
  async getAll() {
    return {
      statusCode: 200,
      data: await this.tilesService.getAllTiles(),
    };
  }
}
