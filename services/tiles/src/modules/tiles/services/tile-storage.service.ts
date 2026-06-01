import { Injectable } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Tile } from '../entities/tile.entity';

@Injectable()
export class TileStorageService {
  private readonly uploadsDir = join(process.cwd(), 'uploads');
  private readonly mbtilesDir = join(this.uploadsDir, 'mbtiles');
  private readonly geoDir = join(this.uploadsDir, 'geo');

  ensureDirectories(): void {
    this.ensureDirectory(this.mbtilesDir);
    this.ensureDirectory(this.geoDir);
  }

  getMbtilesPath(id: string): string {
    return join(this.mbtilesDir, `${id}.mbtiles`);
  }

  deleteTileFiles(tile: Tile): void {
    this.deleteIfExists(tile.geoJsonPath);
    this.deleteIfExists(tile.mbtilesPath);
  }

  hasGeoJson(tile: Tile): boolean {
    return Boolean(tile.geoJsonPath && existsSync(tile.geoJsonPath));
  }

  createGeoJsonStream(tile: Tile) {
    return createReadStream(tile.geoJsonPath);
  }

  private ensureDirectory(path: string): void {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }

  private deleteIfExists(path?: string | null): void {
    if (path && existsSync(path)) {
      unlinkSync(path);
    }
  }
}
