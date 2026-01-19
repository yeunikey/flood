import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tile } from './entities/tile.entity';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TileserverManagerService } from './tileserver.manager';

const execAsync = promisify(exec);

@Injectable()
export class TilesService implements OnModuleInit {
  private readonly logger = new Logger(TilesService.name);

  constructor(
    @InjectRepository(Tile)
    private tilesRepository: Repository<Tile>,
    private tileserverManager: TileserverManagerService,
  ) {}

  onModuleInit() {
    this.logger.log('Checking mbtiles directory and starting server...');
    this.ensureDirectories();
    this.tileserverManager.restartTileserver();
  }

  private ensureDirectories() {
    const mbDir = join(process.cwd(), 'uploads', 'mbtiles');
    if (!existsSync(mbDir)) mkdirSync(mbDir, { recursive: true });
  }

  async createFromGeoJson(
    fileData: { path: string; filename: string },
    meta: { id: string; name?: string },
  ): Promise<Tile> {
    // Берем только id и name, остальное мусор
    const { id, name } = meta;

    // 1. Путь к GeoJSON (уже лежит в uploads/geo)
    const geoJsonPath = fileData.path;

    // 2. Путь для генерации mbtiles
    const mbtilesDir = join(process.cwd(), 'uploads', 'mbtiles');
    const mbtilesFilename = `${id}.mbtiles`;
    const mbtilesPath = join(mbtilesDir, mbtilesFilename);

    this.ensureDirectories();

    // 3. Запускаем Tippecanoe
    const cmd = `tippecanoe -o "${mbtilesPath}" -f -zg --drop-densest-as-needed "${geoJsonPath}"`;
    this.logger.log(`Generating mbtiles: ${cmd}`);

    try {
      await execAsync(cmd);
    } catch (error) {
      this.logger.error('Tippecanoe generation failed', error);
      throw new Error('Failed to generate mbtiles');
    }

    // 4. Сохраняем в БД чистый объект
    const tile = this.tilesRepository.create({
      id,
      name,
      geoJsonPath: geoJsonPath,
      mbtilesPath: mbtilesPath,
    });

    return this.tilesRepository.save(tile);
  }

  async getAllTiles(): Promise<Tile[]> {
    return this.tilesRepository.find();
  }
}
