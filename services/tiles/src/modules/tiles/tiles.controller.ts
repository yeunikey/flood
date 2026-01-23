import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  ValidationPipe,
  UsePipes,
  Delete,
  Param,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { TilesService } from './tiles.service';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import { CreateTileDto } from './dto/create-tile.dto';
import { GrpcMethod } from '@nestjs/microservices';

interface MulterRequest extends Request {
  body: Partial<CreateTileDto>;
}

@Controller('')
export class TilesController {
  constructor(private readonly tilesService: TilesService) {}

  @GrpcMethod('TilesService', 'FindMany')
  async findMany(data: { ids: string[] }) {
    const tiles = await this.tilesService.findByIds(data.ids);

    return {
      tiles: tiles.map((tile) => ({
        id: tile.id,
        name: tile.name,
      })),
    };
  }

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

    const tile = await this.tilesService.createFromGeoJson(
      { path: geoFile.path, filename: geoFile.filename },
      {
        id,
        name: body.name,
      },
    );

    return {
      status: 'success',
      uuid: tile.id,
      message: 'Tile processed and saved',
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.tilesService.delete(id);
    return {
      statusCode: 200,
      message: 'Tile deleted successfully',
    };
  }
}
