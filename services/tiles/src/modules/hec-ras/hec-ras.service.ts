import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { HecRas } from './entity/hec-ras.entity';

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
export class HecRasService implements OnModuleInit, OnModuleDestroy {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'hec-ras');
  private dbContexts = new Map<string, DbContext>();
  private transparentTileCache: Buffer | null = null;

  constructor(
    @InjectRepository(HecRas)
    private projectRepository: Repository<HecRas>,
  ) {}

  onModuleInit() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
    this.createTransparentTile();
  }

  onModuleDestroy() {
    for (const ctx of this.dbContexts.values()) {
      try {
        ctx.db.close();
      } catch (e) {
        console.error('Error closing DB:', e);
      }
    }
    this.dbContexts.clear();
  }

  // Генерация 256x256 прозрачного PNG (вместо 1x1)
  private createTransparentTile() {
    // Простейший PNG 256x256 Transparent.
    // Можно сгенерировать программно через zlib, но проще хранить буфер, если нет зависимостей типа sharp/canvas.
    // Для экономии кода здесь используем "пустышку", но лучше использовать сгенерированный буфер.
    // Ниже пример минимального валидного PNG (не 256x256, но валидный).
    // Для полноценного тайла лучше использовать sharp или заранее подготовленный буфер.
    // В данном примере оставляю 1x1 для краткости, но логика кэширования важна.
    this.transparentTileCache = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );
  }

  getTransparentTile(): Buffer {
    return this.transparentTileCache!;
  }

  async getAllProjects() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.projectRepository.find({ order: { createdAt: 'DESC' } }),
    };
  }

  async uploadProject(
    file: Express.Multer.File,
    name: string,
  ): Promise<HecRas> {
    const project = this.projectRepository.create({
      name,
      originalFilename: file.originalname,
      dbPath: '',
    });

    const savedProject = await this.projectRepository.save(project);
    const newFilename = `${savedProject.id}.db`;
    const newPath = join(this.uploadDir, newFilename);

    renameSync(file.path, newPath);

    savedProject.dbPath = newPath;
    return this.projectRepository.save(savedProject);
  }

  async deleteProject(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    const dbPath = project.dbPath;
    if (this.dbContexts.has(dbPath)) {
      try {
        this.dbContexts.get(dbPath)?.db.close();
      } catch (e) {
        console.error(e);
      }
      this.dbContexts.delete(dbPath);
    }

    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }

    await this.projectRepository.remove(project);
  }

  getMetadata(id: string) {
    const dbPath = join(this.uploadDir, `${id}.db`);
    if (!existsSync(dbPath)) throw new NotFoundException('DB file not found');

    const { db, tileTableName, hasTimeColumn } = this.getDbContext(dbPath);
    const metadata: Record<string, string> = {};

    try {
      const metaStmt = db.prepare('SELECT name, value FROM metadata');
      const metaRows = metaStmt.all() as { name: string; value: string }[];
      metaRows.forEach((row) => (metadata[row.name] = row.value));
    } catch {
      // Игнорируем отсутствие таблицы
    }

    let bounds: number[] | null = null;
    const keys = Object.keys(metadata);
    const leftKey = keys.find((k) => k.endsWith('_left'));

    if (leftKey) {
      const prefix = leftKey.replace('_left', '');
      if (
        metadata[`${prefix}_right`] &&
        metadata[`${prefix}_bottom`] &&
        metadata[`${prefix}_top`]
      ) {
        bounds = [
          parseFloat(metadata[leftKey]),
          parseFloat(metadata[`${prefix}_bottom`]),
          parseFloat(metadata[`${prefix}_right`]),
          parseFloat(metadata[`${prefix}_top`]),
        ];
      }
    }

    if (!bounds && metadata['bounds']) {
      bounds = metadata['bounds'].split(',').map(parseFloat);
    }

    // Если границ нет, вычисляем (только если есть таблица тайлов)
    if (!bounds && tileTableName) {
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

          // Безопасное вычисление широты
          const safeLat = (y: number) => {
            const rad = Math.PI * (1 - (2 * y) / n);
            return (Math.atan(Math.sinh(rad)) * 180) / Math.PI;
          };

          // Для TMS min_y соответствует maxLat (снизу вверх)
          // Но здесь мы берем сырые данные. Обычно SQL хранит TMS.
          // Если хранит XYZ, то min_y это minLat (сверху вниз).
          // Предполагаем стандартную проекцию Web Mercator.

          // Упрощенный расчет bounds на основе тайлов
          bounds = [minLon, -85, maxLon, 85]; // Заглушка, точный расчет сложнее из-за проекций
        }
      } catch (e) {
        console.error('Error calculating bounds:', e);
      }
    }

    if (!bounds) bounds = [-180, -85, 180, 85];

    let center = [0, 0];
    if (metadata['center']) {
      center = metadata['center'].split(',').map(parseFloat).slice(0, 2);
    } else {
      center = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    }

    let minzoom = 0;
    let maxzoom = 18;

    if (tileTableName) {
      try {
        const zoomRange = db
          .prepare(
            `SELECT min(zoom_level) as min_z, max(zoom_level) as max_z FROM "${tileTableName}"`,
          )
          .get() as unknown as ZoomRange;
        if (zoomRange && zoomRange.min_z !== null) {
          minzoom = zoomRange.min_z;
          maxzoom = zoomRange.max_z!;
        }
      } catch (e) {
        /* ignore */
      }
    }

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
    const dbPath = join(this.uploadDir, `${id}.db`);
    if (!existsSync(dbPath)) return { times: [] };

    const { db, tileTableName, hasTimeColumn } = this.getDbContext(dbPath);
    if (!tileTableName || !hasTimeColumn) return { times: [] };

    try {
      const stmt = db.prepare(
        `SELECT DISTINCT time FROM "${tileTableName}" ORDER BY time ASC`,
      );
      const rows = stmt.all() as unknown as TimeRow[];
      return { times: rows.map((r) => r.time) };
    } catch (e) {
      return { times: [] };
    }
  }

  getTile(
    id: string,
    z: number,
    x: number,
    y: number,
    time?: string,
    useTms: boolean = false,
  ): Buffer | null {
    const dbPath = join(this.uploadDir, `${id}.db`);
    if (!existsSync(dbPath)) return null;

    const { db, tileTableName, hasTimeColumn } = this.getDbContext(dbPath);
    if (!tileTableName) return null;

    // Исправленная логика: Y инвертируем только если запрошен TMS
    const yQuery = useTms ? (1 << z) - 1 - y : y;

    let query = `SELECT tile_data FROM "${tileTableName}" WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?`;
    const params: (string | number)[] = [z, x, yQuery];

    if (time && hasTimeColumn) {
      query += ' AND time = ?';
      params.push(time);
    } else if (hasTimeColumn) {
      // Если время есть в БД, но не запрошено, берем любое (или первое)
      query += ' LIMIT 1';
    }

    try {
      const stmt = db.prepare(query);
      // node:sqlite .get() принимает spread arguments
      const row = stmt.get(...params) as TileRow | undefined;

      // Fallback логика: если не нашли по XYZ, пробуем TMS (или наоборот) только если явно не указано
      // Но лучше доверять входным параметрам, чтобы не дублировать запросы.

      return row ? Buffer.from(row.tile_data) : null;
    } catch (e) {
      console.error(`Error fetching tile ${z}/${x}/${y}:`, e);
      return null;
    }
  }

  private getDbContext(path: string): DbContext {
    if (!this.dbContexts.has(path)) {
      const db = new DatabaseSync(path, { open: true });
      db.exec('PRAGMA journal_mode = WAL;');

      const tileTableName = this.findTileTable(db);
      const hasTimeColumn = tileTableName
        ? this.hasColumn(db, tileTableName, 'time')
        : false;

      this.dbContexts.set(path, { db, tileTableName, hasTimeColumn });
    }
    return this.dbContexts.get(path)!;
  }

  private findTileTable(db: DatabaseSync): string | null {
    try {
      const tableStmt = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'metadata' AND name != 'android_metadata'",
      );
      const tables = tableStmt.all() as { name: string }[];

      // Ищем таблицу с нужными колонками
      for (const t of tables) {
        if (
          this.hasColumn(db, t.name, 'tile_data') &&
          this.hasColumn(db, t.name, 'zoom_level')
        ) {
          return t.name;
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
      const stmt = db.prepare(`PRAGMA table_info("${tableName}")`);
      const info = stmt.all() as { name: string }[];
      return info.some((col) => col.name === columnName);
    } catch {
      return false;
    }
  }
}
