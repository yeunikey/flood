import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'fs';
import { join } from 'path';

interface TileRange {
  min_x: number | null;
  max_x: number | null;
  min_y: number | null;
  max_y: number | null;
  max_z: number | null;
}

interface ZoomRange {
  min_z: number | null;
  max_z: number | null;
}

interface DbContext {
  db: DatabaseSync;
  tileTableName: string | null;
  hasTimeColumn: boolean;
}

interface TileRow {
  tile_data: Uint8Array;
}

interface TimeRow {
  time: string;
}

@Injectable()
export class HecRasDbService {
  private readonly logger = new Logger(HecRasDbService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads', 'hec-ras');
  private readonly dbContexts = new Map<string, DbContext>();
  private readonly transparentTile = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  );

  closeAll(): void {
    for (const context of this.dbContexts.values()) {
      try {
        context.db.close();
      } catch (error) {
        this.logger.error('Error closing DB', error);
      }
    }
    this.dbContexts.clear();
  }

  close(dbPath: string): void {
    const context = this.dbContexts.get(dbPath);
    if (!context) return;

    try {
      context.db.close();
    } catch (error) {
      this.logger.error(`Error closing DB ${dbPath}`, error);
    }
    this.dbContexts.delete(dbPath);
  }

  getTransparentTile(): Buffer {
    return this.transparentTile;
  }

  getMetadata(id: string) {
    const dbPath = this.getDbPath(id);
    if (!existsSync(dbPath)) throw new NotFoundException('DB file not found');

    const { db, tileTableName, hasTimeColumn } = this.getDbContext(dbPath);
    const metadata = this.readMetadata(db);
    const bounds = this.resolveBounds(metadata, db, tileTableName);
    const center = this.resolveCenter(metadata, bounds);
    const { minzoom, maxzoom } = this.resolveZoomRange(db, tileTableName);

    return {
      ...metadata,
      bounds,
      center,
      minzoom,
      maxzoom,
      has_time: hasTimeColumn,
    };
  }

  getTimes(id: string) {
    const dbPath = this.getDbPath(id);
    if (!existsSync(dbPath)) return { times: [] };

    const { db, tileTableName, hasTimeColumn } = this.getDbContext(dbPath);
    if (!tileTableName || !hasTimeColumn) return { times: [] };

    try {
      const stmt = db.prepare(
        `SELECT DISTINCT time FROM "${tileTableName}" ORDER BY time ASC`,
      );
      const rows = stmt.all() as unknown as TimeRow[];
      return { times: rows.map((row) => row.time) };
    } catch {
      return { times: [] };
    }
  }

  getTile(
    id: string,
    z: number,
    x: number,
    y: number,
    time?: string,
    useTms = false,
  ): Buffer | null {
    const dbPath = this.getDbPath(id);
    if (!existsSync(dbPath)) return null;

    const { db, tileTableName, hasTimeColumn } = this.getDbContext(dbPath);
    if (!tileTableName) return null;

    const yQuery = useTms ? (1 << z) - 1 - y : y;
    let query = `SELECT tile_data FROM "${tileTableName}" WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?`;
    const params: (string | number)[] = [z, x, yQuery];

    if (time && hasTimeColumn) {
      query += ' AND time = ?';
      params.push(time);
    } else if (hasTimeColumn) {
      query += ' LIMIT 1';
    }

    try {
      const row = db.prepare(query).get(...params) as TileRow | undefined;
      return row ? Buffer.from(row.tile_data) : null;
    } catch (error) {
      this.logger.error(`Error fetching tile ${z}/${x}/${y}`, error);
      return null;
    }
  }

  private getDbPath(id: string): string {
    return join(this.uploadDir, `${id}.db`);
  }

  private getDbContext(path: string): DbContext {
    const cached = this.dbContexts.get(path);
    if (cached) return cached;

    const db = new DatabaseSync(path, { open: true });
    db.exec('PRAGMA journal_mode = WAL;');

    const tileTableName = this.findTileTable(db);
    const hasTimeColumn = tileTableName
      ? this.hasColumn(db, tileTableName, 'time')
      : false;
    const context = { db, tileTableName, hasTimeColumn };
    this.dbContexts.set(path, context);

    return context;
  }

  private readMetadata(db: DatabaseSync): Record<string, string> {
    const metadata: Record<string, string> = {};

    try {
      const rows = db.prepare('SELECT name, value FROM metadata').all() as {
        name: string;
        value: string;
      }[];
      rows.forEach((row) => (metadata[row.name] = row.value));
    } catch {
      return metadata;
    }

    return metadata;
  }

  private resolveBounds(
    metadata: Record<string, string>,
    db: DatabaseSync,
    tileTableName: string | null,
  ): number[] {
    const keys = Object.keys(metadata);
    const leftKey = keys.find((key) => key.endsWith('_left'));

    if (leftKey) {
      const prefix = leftKey.replace('_left', '');
      if (
        metadata[`${prefix}_right`] &&
        metadata[`${prefix}_bottom`] &&
        metadata[`${prefix}_top`]
      ) {
        return [
          parseFloat(metadata[leftKey]),
          parseFloat(metadata[`${prefix}_bottom`]),
          parseFloat(metadata[`${prefix}_right`]),
          parseFloat(metadata[`${prefix}_top`]),
        ];
      }
    }

    if (metadata.bounds) {
      return metadata.bounds.split(',').map(parseFloat);
    }

    if (tileTableName) {
      try {
        const range = db
          .prepare(
            `SELECT 
               min(tile_column) as min_x, max(tile_column) as max_x,
               min(tile_row) as min_y, max(tile_row) as max_y,
               max(zoom_level) as max_z
             FROM "${tileTableName}"`,
          )
          .get() as unknown as TileRange;

        if (range && range.max_z !== null && range.min_x !== null) {
          const z = range.max_z;
          const n = Math.pow(2, z);
          const minLon = (range.min_x / n) * 360 - 180;
          const maxLon = ((range.max_x! + 1) / n) * 360 - 180;
          return [minLon, -85, maxLon, 85];
        }
      } catch (error) {
        this.logger.error('Error calculating bounds', error);
      }
    }

    return [-180, -85, 180, 85];
  }

  private resolveCenter(
    metadata: Record<string, string>,
    bounds: number[],
  ): number[] {
    if (metadata.center) {
      return metadata.center.split(',').map(parseFloat).slice(0, 2);
    }

    return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
  }

  private resolveZoomRange(
    db: DatabaseSync,
    tileTableName: string | null,
  ): { minzoom: number; maxzoom: number } {
    if (!tileTableName) return { minzoom: 0, maxzoom: 18 };

    try {
      const zoomRange = db
        .prepare(
          `SELECT min(zoom_level) as min_z, max(zoom_level) as max_z FROM "${tileTableName}"`,
        )
        .get() as unknown as ZoomRange;
      if (zoomRange && zoomRange.min_z !== null) {
        return {
          minzoom: zoomRange.min_z,
          maxzoom: zoomRange.max_z!,
        };
      }
    } catch {
      return { minzoom: 0, maxzoom: 18 };
    }

    return { minzoom: 0, maxzoom: 18 };
  }

  private findTileTable(db: DatabaseSync): string | null {
    try {
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'metadata' AND name != 'android_metadata'",
        )
        .all() as { name: string }[];

      for (const table of tables) {
        if (
          this.hasColumn(db, table.name, 'tile_data') &&
          this.hasColumn(db, table.name, 'zoom_level')
        ) {
          return table.name;
        }
      }
      return tables.length > 0 ? tables[0].name : null;
    } catch {
      return null;
    }
  }

  private hasColumn(
    db: DatabaseSync,
    tableName: string,
    columnName: string,
  ): boolean {
    try {
      const info = db.prepare(`PRAGMA table_info("${tableName}")`).all() as {
        name: string;
      }[];
      return info.some((column) => column.name === columnName);
    } catch {
      return false;
    }
  }
}
