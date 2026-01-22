import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { readdirSync, existsSync } from 'fs';

@Injectable()
export class TileserverService implements OnModuleInit {
  private readonly logger = new Logger(TileserverService.name);
  private readonly tilesPath = join(process.cwd(), 'uploads', 'mbtiles');
  private dbInstances: Record<string, DatabaseSync> = {};

  onModuleInit() {
    this.loadTilesets();
  }

  public loadTilesets() {
    if (!existsSync(this.tilesPath)) return;

    const files = readdirSync(this.tilesPath).filter((f) =>
      f.endsWith('.mbtiles'),
    );

    files.forEach((file) => {
      const name = file.replace('.mbtiles', '');
      if (!this.dbInstances[name]) {
        try {
          const dbPath = join(this.tilesPath, file);
          const db = new DatabaseSync(dbPath);
          this.dbInstances[name] = db;
          this.logger.log(
            `[Native SQLite] Тайлсет загружен и готов к раздаче: ${name}`,
          );
        } catch {
          this.logger.error(`Ошибка открытия mbtiles`);
        }
      }
    });
  }

  getTile(tileset: string, z: number, x: number, y: number): Buffer | null {
    const db = this.dbInstances[tileset];
    if (!db) return null;

    const tmsY = (1 << z) - 1 - y;
    try {
      const query = db.prepare(
        'SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?',
      );
      const row = query.get(z, x, tmsY) as
        | { tile_data: Uint8Array }
        | undefined;
      return row?.tile_data ? Buffer.from(row.tile_data) : null;
    } catch {
      this.logger.error(`Ошибка при чтении тайла ${tileset}`);
      return null;
    }
  }

  getMetadata(tileset: string) {
    const db = this.dbInstances[tileset];
    if (!db) throw new NotFoundException('Metadata not found');

    const query = db.prepare('SELECT name, value FROM metadata');
    const rows = query.all() as { name: string; value: string }[];
    const metadata: Record<string, string> = {};
    rows.forEach((r) => (metadata[r.name] = r.value));

    return {
      ...metadata,
      tiles: [`/tiles-data/${tileset}/{z}/{x}/{y}.pbf`],
      tilejson: '2.0.0',
    };
  }
}
