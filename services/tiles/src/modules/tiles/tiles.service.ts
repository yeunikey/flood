import {
  Injectable,
  OnModuleInit,
  Logger,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tile } from './entities/tile.entity';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TileserverService } from '../tileserver/tileserver.service';
import { TileStorageService } from './services/tile-storage.service';

const execAsync = promisify(exec);

@Injectable()
export class TilesService implements OnModuleInit {
  private readonly logger = new Logger(TilesService.name);

  constructor(
    @InjectRepository(Tile)
    private tilesRepository: Repository<Tile>,
    private tileserverService: TileserverService,
    private readonly tileStorage: TileStorageService,
  ) {}

  onModuleInit() {
    this.tileStorage.ensureDirectories();
  }

  async createFromGeoJson(
    fileData: { path: string; filename: string },
    meta: { id: string; name?: string },
  ): Promise<Tile> {
    const { id, name } = meta;
    const mbtilesPath = this.tileStorage.getMbtilesPath(id);

    const cmd = `tippecanoe -o "${mbtilesPath}" -S 10 -f -zg --drop-densest-as-needed "${fileData.path}"`;

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

  async delete(id: string) {
    const tile = await this.tilesRepository.findOne({ where: { id } });
    if (!tile) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Tile not found',
      };
    }

    try {
      this.tileStorage.deleteTileFiles(tile);
    } catch (error) {
      this.logger.error(`Error deleting files for tile ${id}`, error);
    }

    await this.tilesRepository.remove(tile);

    this.tileserverService.loadTilesets();

    return {
      status: HttpStatus.OK,
    };
  }

  async findByIds(ids: string[]): Promise<Tile[]> {
    if (!ids || ids.length === 0) return [];
    return this.tilesRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async getGeoJsonStream(id: string) {
    const tile = await this.tilesRepository.findOne({ where: { id } });
    if (!tile || !this.tileStorage.hasGeoJson(tile)) {
      throw new NotFoundException('GeoJSON file not found');
    }
    return {
      stream: this.tileStorage.createGeoJsonStream(tile),
      filename: `${tile.name || tile.id}.json`,
    };
  }
}
