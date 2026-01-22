import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tile } from './entities/tile.entity';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TileserverService } from '../tileserver/tileserver.service';

const execAsync = promisify(exec);

@Injectable()
export class TilesService implements OnModuleInit {
  private readonly logger = new Logger(TilesService.name);

  constructor(
    @InjectRepository(Tile)
    private tilesRepository: Repository<Tile>,
    private tileserverService: TileserverService,
  ) {}

  onModuleInit() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const mbDir = join(process.cwd(), 'uploads', 'mbtiles');
    const geoDir = join(process.cwd(), 'uploads', 'geo');
    if (!existsSync(mbDir)) mkdirSync(mbDir, { recursive: true });
    if (!existsSync(geoDir)) mkdirSync(geoDir, { recursive: true });
  }

  async createFromGeoJson(
    fileData: { path: string; filename: string },
    meta: { id: string; name?: string },
  ): Promise<Tile> {
    const { id, name } = meta;
    const mbtilesPath = join(
      process.cwd(),
      'uploads',
      'mbtiles',
      `${id}.mbtiles`,
    );

    const cmd = `tippecanoe -o "${mbtilesPath}" -f -zg --drop-densest-as-needed "${fileData.path}"`;

    try {
      this.logger.log(`Starting Tippecanoe...`);
      await execAsync(cmd);

      this.tileserverService.loadTilesets();
    } catch (error) {
      this.logger.error('Tippecanoe failed', error);
      throw new Error('Failed to generate tiles');
    }

    const tile = this.tilesRepository.create({
      id,
      name,
      geoJsonPath: fileData.path,
      mbtilesPath: mbtilesPath,
    });

    return this.tilesRepository.save(tile);
  }

  async getAllTiles() {
    return this.tilesRepository.find();
  }
}
