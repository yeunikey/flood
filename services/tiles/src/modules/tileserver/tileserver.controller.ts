import {
  Controller,
  Get,
  Param,
  Res,
  Header,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { TileserverService } from './tileserver.service';

@Controller('server')
export class TileserverController {
  constructor(private readonly tilesService: TileserverService) {}

  @Get(':tileset/:z/:x/:y.pbf')
  @Header('Content-Type', 'application/x-protobuf')
  @Header('Content-Encoding', 'gzip')
  @Header('Cache-Control', 'public, max-age=31536000')
  getTile(
    @Param('tileset') tileset: string,
    @Param('z') z: number,
    @Param('x') x: number,
    @Param('y') yStr: string,
    @Res() res: Response,
  ) {
    const y = parseInt(yStr.replace('.pbf', ''), 10);

    const tileData = this.tilesService.getTile(
      tileset,
      Number(z),
      Number(x),
      y,
    );

    if (!tileData) {
      throw new NotFoundException();
    }

    res.send(tileData);
  }

  @Get(':tileset.json')
  getMetadata(@Param('tileset') tileset: string) {
    return this.tilesService.getMetadata(tileset);
  }
}
