import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { inflateRawSync } from 'node:zlib';
import {
  Category,
  DataSourceEntity,
  DataValue,
  Group,
  MethodType,
  Qcl,
  Site,
  Variable,
} from './entities/hydro-parser.entities';
import { ImportHydroSiteDto } from './dto/hydro-parser.dto';

const ECODATA_URL = 'http://ecodata.kz:3838/app_dg_map_ru';
const HYDRO_CATEGORY_NAME = 'Гидрологические посты';
const HYDRO_SOURCE_NAME = 'Казгидромет';
const METHOD_NAME = 'Автоматическое';
const QCL_NAME = 'Проверено';
const SCHEDULE_TIME_ZONE =
  process.env.HYDRO_PARSER_SCHEDULE_TZ ?? 'Asia/Almaty';
const SCHEDULE_TIME = process.env.HYDRO_PARSER_SCHEDULE_TIME ?? '16:00';

const VARIABLE_BY_ECODATA_COLUMN: Record<string, string> = {
  level: 'Уровень воды',
  discharge: 'Расход воды',
};

interface RemoteSite {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  remoteDate: string | null;
  hasLevel: boolean;
  hasDischarge: boolean;
  currentValues: Record<string, string | null>;
}

interface ParsedHydroRow {
  dateUtc: string;
  values: Record<string, string>;
}

interface ShinyMessage {
  config?: { sessionId: string; workerId: string };
  values?: {
    map?: unknown;
    plot?: unknown;
  };
  errors?: Record<string, unknown>;
  busy?: 'busy' | 'idle';
}

interface LeafletMarkerCall {
  method: string;
  args: [
    unknown[],
    unknown[],
    unknown,
    unknown[],
    unknown,
    unknown,
    unknown[],
    ...unknown[],
  ];
}

interface LeafletMapValue {
  x?: {
    calls?: LeafletMarkerCall[];
  };
}

@Injectable()
export class HydroParserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HydroParserService.name);
  private readonly remoteCache = new Map<
    string,
    { expiresAt: number; data: RemoteSite[] }
  >();
  private scheduleInterval: NodeJS.Timeout | null = null;
  private isBatchImportRunning = false;
  private lastScheduledRunDate: string | null = null;

  constructor(
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(MethodType)
    private readonly methodRepo: Repository<MethodType>,
    @InjectRepository(Qcl)
    private readonly qclRepo: Repository<Qcl>,
    @InjectRepository(DataSourceEntity)
    private readonly sourceRepo: Repository<DataSourceEntity>,
    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(DataValue)
    private readonly dataValueRepo: Repository<DataValue>,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    if (process.env.HYDRO_PARSER_SCHEDULE_ENABLED === 'false') {
      this.logger.log('Ежедневный парсинг гидропостов выключен');
      return;
    }

    this.scheduleInterval = setInterval(() => {
      void this.runScheduledImportIfDue();
    }, 60 * 1000);
    this.scheduleInterval.unref?.();

    this.logger.log(
      `Ежедневный парсинг гидропостов включен: ${SCHEDULE_TIME} ${SCHEDULE_TIME_ZONE}`,
    );
    void this.runScheduledImportIfDue();
  }

  onModuleDestroy() {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
  }

  async getSitesOverview() {
    const [sites, remoteSites, category, source] = await Promise.all([
      this.siteRepo.find({ order: { code: 'ASC' } }),
      this.getRemoteSites(),
      this.getRequiredCategory(),
      this.getRequiredSource(),
    ]);

    const remoteMap = new Map(remoteSites.map((site) => [site.code, site]));
    const ranges = await this.getLoadedRanges(category.id, source.id);

    return {
      statusCode: HttpStatus.OK,
      data: sites.map((site) => {
        const remote = remoteMap.get(site.code);
        return {
          site,
          remoteAvailable: Boolean(remote),
          remote,
          loaded: ranges.get(site.id) ?? null,
        };
      }),
    };
  }

  async getRemoteSiteAvailability(siteCode: string) {
    const remote = (await this.getRemoteSites()).find(
      (site) => site.code === siteCode,
    );

    if (!remote) {
      throw new NotFoundException(`Гидропост ${siteCode} не найден на ecodata`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: remote,
    };
  }

  async importAllAvailableSites() {
    if (this.isBatchImportRunning) {
      return {
        statusCode: HttpStatus.OK,
        data: {
          running: true,
          message: 'Импорт гидропостов уже выполняется',
        },
      };
    }

    this.isBatchImportRunning = true;
    const startedAt = new Date().toISOString();

    try {
      const [sites, remoteSites] = await Promise.all([
        this.siteRepo.find({ order: { code: 'ASC' } }),
        this.refreshRemoteSites(),
      ]);
      const remoteMap = new Map(remoteSites.map((site) => [site.code, site]));
      const availableSites = sites.filter((site) => remoteMap.has(site.code));

      const results: {
        siteCode: string;
        siteName: string;
        ok: boolean;
        insertedGroups?: number;
        insertedValues?: number;
        startDate?: string;
        endDate?: string;
        requestedStartDate?: string;
        message?: string;
        error?: string;
      }[] = [];

      for (const site of availableSites) {
        try {
          const response = await this.importSite({ siteCode: site.code });
          results.push({
            siteCode: site.code,
            siteName: site.name,
            ok: true,
            ...response.data,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Неизвестная ошибка';
          this.logger.error(`Ошибка импорта ${site.code}: ${message}`);
          results.push({
            siteCode: site.code,
            siteName: site.name,
            ok: false,
            error: message,
          });
        }
      }

      const insertedGroups = results.reduce(
        (sum, item) => sum + (item.insertedGroups ?? 0),
        0,
      );
      const insertedValues = results.reduce(
        (sum, item) => sum + (item.insertedValues ?? 0),
        0,
      );

      return {
        statusCode: HttpStatus.OK,
        data: {
          running: false,
          startedAt,
          finishedAt: new Date().toISOString(),
          totalSites: sites.length,
          availableSites: availableSites.length,
          successfulSites: results.filter((item) => item.ok).length,
          failedSites: results.filter((item) => !item.ok).length,
          insertedGroups,
          insertedValues,
          results,
        },
      };
    } finally {
      this.isBatchImportRunning = false;
    }
  }

  async importSite(dto: ImportHydroSiteDto) {
    const site = await this.siteRepo.findOne({ where: { code: dto.siteCode } });
    if (!site) {
      throw new NotFoundException(`Точка ${dto.siteCode} не найдена в БД`);
    }

    const remote = (await this.getRemoteSites()).find(
      (item) => item.code === site.code,
    );
    if (!remote) {
      throw new NotFoundException(
        `Гидропост ${site.code} не найден на ecodata`,
      );
    }

    const endDate =
      dto.endDate ?? remote.remoteDate ?? new Date().toISOString().slice(0, 10);

    const [category, source, method, qcl, variables] = await Promise.all([
      this.getRequiredCategory(),
      this.getRequiredSource(),
      this.getRequiredMethod(),
      this.getRequiredQcl(),
      this.getHydroVariables(),
    ]);

    const requestedStartDate =
      dto.startDate ??
      (await this.getNextImportStartDate(
        site.id,
        category.id,
        source.id,
        endDate,
      ));

    if (requestedStartDate > endDate) {
      return {
        statusCode: HttpStatus.OK,
        data: {
          insertedGroups: 0,
          insertedValues: 0,
          startDate: requestedStartDate,
          endDate,
          message: 'Новых данных на ecodata пока нет',
        },
      };
    }

    const rows = await this.downloadSiteRowsWithFallback(
      remote,
      requestedStartDate,
      endDate,
      !dto.startDate,
    );
    if (!rows.length) {
      return {
        statusCode: HttpStatus.OK,
        data: {
          insertedGroups: 0,
          insertedValues: 0,
          startDate: requestedStartDate,
          endDate,
          message: 'В выбранном диапазоне на ecodata данных нет',
        },
      };
    }

    const importStartDate =
      this.toDateOnly(rows[0].dateUtc) ?? requestedStartDate;
    const importEndDate =
      this.toDateOnly(rows.at(-1)?.dateUtc ?? endDate) ?? endDate;

    const result = await this.dataSource.transaction(async (manager) => {
      let insertedGroups = 0;
      let insertedValues = 0;

      await manager.query(
        `
          DELETE FROM data_value
          WHERE group_id IN (
            SELECT id FROM "group"
            WHERE site_id = $1
              AND category_id = $2
              AND source_id = $3
              AND date_utc BETWEEN $4 AND $5
          )
        `,
        [
          site.id,
          category.id,
          source.id,
          `${importStartDate}T00:00:00.000Z`,
          `${importEndDate}T23:59:59.999Z`,
        ],
      );
      await manager.query(
        `
          DELETE FROM "group"
          WHERE site_id = $1
            AND category_id = $2
            AND source_id = $3
            AND date_utc BETWEEN $4 AND $5
        `,
        [
          site.id,
          category.id,
          source.id,
          `${importStartDate}T00:00:00.000Z`,
          `${importEndDate}T23:59:59.999Z`,
        ],
      );

      for (const row of rows) {
        const group = await manager.getRepository(Group).save({
          date_utc: new Date(row.dateUtc),
          site,
          category,
          source,
          method,
          qcl,
        });
        insertedGroups += 1;

        const values: Partial<DataValue>[] = Object.entries(row.values)
          .map(([name, value]) => ({
            value,
            group,
            variable: variables.get(name),
          }))
          .filter((item) =>
            Boolean(item.variable && item.value && item.value !== 'NA'),
          );

        if (values.length) {
          await manager.getRepository(DataValue).insert(values);
          insertedValues += values.length;
        }
      }

      return { insertedGroups, insertedValues };
    });

    return {
      statusCode: HttpStatus.OK,
      data: {
        ...result,
        startDate: importStartDate,
        endDate: importEndDate,
        requestedStartDate,
      },
    };
  }

  private async getNextImportStartDate(
    siteId: number,
    categoryId: number,
    sourceId: number,
    endDate: string,
  ) {
    const latest = await this.groupRepo
      .createQueryBuilder('g')
      .select('MAX(g.date_utc)', 'latestDate')
      .where('g.site_id = :siteId', { siteId })
      .andWhere('g.category_id = :categoryId', { categoryId })
      .andWhere('g.source_id = :sourceId', { sourceId })
      .getRawOne<{ latestDate: Date | null }>();

    if (latest?.latestDate) {
      return this.addDays(this.toDateOnly(latest.latestDate) ?? endDate, 1);
    }

    return `${endDate.slice(0, 4)}-01-01`;
  }

  private async getLoadedRanges(categoryId: number, sourceId: number) {
    const raw = await this.groupRepo
      .createQueryBuilder('g')
      .select('g.site_id', 'siteId')
      .addSelect('MIN(g.date_utc)', 'startDate')
      .addSelect('MAX(g.date_utc)', 'endDate')
      .addSelect('COUNT(*)', 'groupsCount')
      .where('g.category_id = :categoryId', { categoryId })
      .andWhere('g.source_id = :sourceId', { sourceId })
      .groupBy('g.site_id')
      .getRawMany<{
        siteId: string;
        startDate: Date;
        endDate: Date;
        groupsCount: string;
      }>();

    return new Map(
      raw.map((row) => [
        Number(row.siteId),
        {
          startDate: this.toDateOnly(row.startDate),
          endDate: this.toDateOnly(row.endDate),
          groupsCount: Number(row.groupsCount),
        },
      ]),
    );
  }

  private async runScheduledImportIfDue() {
    const scheduledTime = this.parseScheduleTime();
    const now = this.getZonedNow(SCHEDULE_TIME_ZONE);
    if (
      now.hour !== scheduledTime.hour ||
      now.minute !== scheduledTime.minute ||
      this.lastScheduledRunDate === now.date
    ) {
      return;
    }

    this.lastScheduledRunDate = now.date;
    this.logger.log(
      `Запуск ежедневного парсинга гидропостов за ${now.date} (${SCHEDULE_TIME_ZONE})`,
    );

    try {
      const result = await this.importAllAvailableSites();
      this.logger.log(
        `Ежедневный парсинг завершен: ${JSON.stringify(result.data)}`,
      );
    } catch (error) {
      this.logger.error(
        `Ежедневный парсинг завершился ошибкой: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private parseScheduleTime() {
    const match = SCHEDULE_TIME.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return { hour: 16, minute: 0 };
    return { hour: Number(match[1]), minute: Number(match[2]) };
  }

  private getZonedNow(timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );

    return {
      date: `${values.year}-${values.month}-${values.day}`,
      hour: Number(values.hour),
      minute: Number(values.minute),
    };
  }

  private async getRemoteSites(): Promise<RemoteSite[]> {
    const cached = this.remoteCache.get('sites');
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const session = await this.openShinySession();
    try {
      const map = await session.waitForMap();
      const sites = this.parseRemoteSites(map);
      this.remoteCache.set('sites', {
        data: sites,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return sites;
    } finally {
      session.close();
    }
  }

  private async refreshRemoteSites() {
    this.remoteCache.delete('sites');
    return this.getRemoteSites();
  }

  private parseRemoteSites(map: unknown): RemoteSite[] {
    const leafletMap = map as LeafletMapValue;
    const markerCall = leafletMap.x?.calls?.find(
      (call) => call.method === 'addAwesomeMarkers',
    );
    if (!markerCall) return [];

    const [latitudes, longitudes, , codes, , , popups] = markerCall.args;
    return codes.map((code: number | string, index: number) => {
      const rawPopup = popups?.[index];
      const popup = typeof rawPopup === 'string' ? rawPopup : '';
      const caption = this.extractCaption(popup);
      const values = this.extractPopupValues(popup);
      return {
        code: String(code),
        name: caption.name || String(code),
        latitude: Number(latitudes[index]),
        longitude: Number(longitudes[index]),
        remoteDate: caption.date,
        hasLevel: Boolean(values['Фактический уровень, см']),
        hasDischarge: Boolean(values['Фактический расход, м³/с']),
        currentValues: values,
      };
    });
  }

  private async downloadSiteRows(
    remote: RemoteSite,
    startDate: string,
    endDate: string,
  ): Promise<ParsedHydroRow[]> {
    const session = await this.openShinySession([startDate, endDate]);
    try {
      await session.waitForMap();
      session.sendUpdate({
        map_marker_click: {
          id: Number.isNaN(Number(remote.code))
            ? remote.code
            : Number(remote.code),
          lat: remote.latitude,
          lng: remote.longitude,
          '.nonce': Math.random(),
        },
      });
      await session.waitForPlot();

      const response = await fetch(
        `${ECODATA_URL}/session/${session.sessionId}/download/downloadData?w=`,
      );
      if (!response.ok) {
        throw new BadRequestException(
          `ecodata вернул ${response.status} при загрузке XLSX`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return this.parseHydroWorkbook(buffer);
    } finally {
      session.close();
    }
  }

  private async downloadSiteRowsWithFallback(
    remote: RemoteSite,
    startDate: string,
    endDate: string,
    allowFallback: boolean,
  ) {
    const rows = await this.downloadSiteRows(remote, startDate, endDate);
    if (rows.length || !allowFallback) return rows;

    let cursor = startDate;
    while (cursor <= endDate) {
      const yearEnd = this.minDate(`${cursor.slice(0, 4)}-12-31`, endDate);
      const yearRows = await this.downloadSiteRows(remote, cursor, yearEnd);
      if (yearRows.length) {
        return this.downloadSiteRows(remote, cursor, endDate);
      }
      cursor = this.addDays(yearEnd, 1);
    }

    return [];
  }

  private parseHydroWorkbook(buffer: Buffer): ParsedHydroRow[] {
    const files = this.readZipFiles(buffer);
    const sheet =
      files.get('xl/worksheets/sheet1.xml') ??
      Array.from(files.entries()).find(([name]) =>
        name.startsWith('xl/worksheets/sheet'),
      )?.[1];
    if (!sheet) return [];

    const sharedStrings = this.readSharedStrings(
      files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '',
    );
    const rows = this.readSheetRows(sheet.toString('utf8'), sharedStrings);
    if (rows.length < 2) return [];

    const headerRowIndex = rows.findIndex((row) =>
      row.some((cell) => cell.trim().toLowerCase() === 'date'),
    );
    if (headerRowIndex === -1) return [];

    const headers = rows[headerRowIndex].map((header) => header.trim());
    const dateIndex = headers.findIndex((header) =>
      /date|дата|time/i.test(header),
    );
    if (dateIndex === -1) return [];
    const timeIndex = headers.findIndex((header) => /^time$/i.test(header));

    return rows.slice(headerRowIndex + 1).flatMap((row) => {
      const date = this.normalizeDate(row[dateIndex]);
      if (!date) return [];
      const time = this.normalizeTime(timeIndex > -1 ? row[timeIndex] : '');

      const values: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index === dateIndex || !header || !row[index]) return;
        const variable = this.resolveVariableName(header);
        if (variable) values[variable] = row[index];
      });

      return Object.keys(values).length
        ? [{ dateUtc: `${date}T${time}:00.000Z`, values }]
        : [];
    });
  }

  private readZipFiles(buffer: Buffer): Map<string, Buffer> {
    const files = new Map<string, Buffer>();
    let offset = 0;

    while (offset < buffer.length - 30) {
      const signature = buffer.readUInt32LE(offset);
      if (signature !== 0x04034b50) {
        offset += 1;
        continue;
      }

      const flags = buffer.readUInt16LE(offset + 6);
      const method = buffer.readUInt16LE(offset + 8);
      const compressedSizeFromHeader = buffer.readUInt32LE(offset + 18);
      const fileNameLength = buffer.readUInt16LE(offset + 26);
      const extraLength = buffer.readUInt16LE(offset + 28);
      const nameStart = offset + 30;
      const name = buffer
        .subarray(nameStart, nameStart + fileNameLength)
        .toString('utf8');
      const dataStart = nameStart + fileNameLength + extraLength;

      let compressedSize = compressedSizeFromHeader;
      let dataEnd = dataStart + compressedSize;

      if (flags & 0x08) {
        const next = buffer.indexOf(
          Buffer.from([0x50, 0x4b, 0x03, 0x04]),
          dataStart,
        );
        const descriptor = buffer.indexOf(
          Buffer.from([0x50, 0x4b, 0x07, 0x08]),
          dataStart,
        );
        dataEnd =
          descriptor > -1 ? descriptor : next > -1 ? next : buffer.length;
        compressedSize = dataEnd - dataStart;
      }

      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      if (method === 8) {
        files.set(name, inflateRawSync(compressed));
      } else if (method === 0) {
        files.set(name, compressed);
      }

      offset = dataEnd + (flags & 0x08 ? 16 : 0);
    }

    return files;
  }

  private readSharedStrings(xml: string): string[] {
    return [...xml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
      this.decodeXml(
        [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((item) => item[1])
          .join(''),
      ),
    );
  }

  private readSheetRows(xml: string, sharedStrings: string[]): string[][] {
    return [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
      const row: string[] = [];
      for (const cellMatch of rowMatch[1].matchAll(
        /<c([^>]*)>([\s\S]*?)<\/c>/g,
      )) {
        const attrs = cellMatch[1];
        const body = cellMatch[2];
        const ref = attrs.match(/\sr="([A-Z]+)\d+"/)?.[1];
        const index = ref ? this.columnIndex(ref) : row.length;
        const raw = body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? '';
        const isShared = /\st="s"/.test(attrs);
        row[index] = isShared
          ? (sharedStrings[Number(raw)] ?? '')
          : this.decodeXml(raw);
      }
      return row;
    });
  }

  private columnIndex(column: string) {
    return (
      column
        .split('')
        .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1
    );
  }

  private normalizeDate(value: string): string | null {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return null;
    const direct = trimmed.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
    if (direct) {
      return `${direct[1]}-${direct[2].padStart(2, '0')}-${direct[3].padStart(2, '0')}`;
    }
    const reversed = trimmed.match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
    if (reversed) {
      return `${reversed[3]}-${reversed[2].padStart(2, '0')}-${reversed[1].padStart(2, '0')}`;
    }
    const serial = Number(trimmed);
    if (Number.isFinite(serial) && serial > 30000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return date.toISOString().slice(0, 10);
    }
    return null;
  }

  private normalizeTime(value: string): string {
    const trimmed = String(value ?? '').trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
    return '00:00';
  }

  private resolveVariableName(header: string) {
    return VARIABLE_BY_ECODATA_COLUMN[header.trim().toLowerCase()] ?? null;
  }

  private extractCaption(html: string) {
    const caption = this.decodeXml(
      html
        .match(/<caption[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1]
        ?.replace(/<[^>]+>/g, ' ') ?? '',
    )
      .replace(/\s+/g, ' ')
      .trim();
    const date = caption.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
    const name = date ? caption.replace(date, '').trim() : caption;
    return { name, date };
  }

  private extractPopupValues(html: string) {
    const values: Record<string, string | null> = {};
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
    for (const row of rows) {
      const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(
        (cell) =>
          this.decodeXml(cell[1].replace(/<[^>]+>/g, ' '))
            .replace(/\s+/g, ' ')
            .trim(),
      );
      if (cells.length === 2)
        values[cells[0]] = cells[1] === 'NA' ? null : cells[1];
    }
    return values;
  }

  private decodeXml(value: string) {
    return String(value)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private async getHydroVariables() {
    const result = new Map<string, Variable>();
    for (const variableName of Object.values(VARIABLE_BY_ECODATA_COLUMN)) {
      const variable = await this.variableRepo.findOne({
        where: { name: variableName },
      });
      if (!variable) {
        throw new NotFoundException(`Переменная "${variableName}" не найдена`);
      }
      result.set(variableName, variable);
    }

    return result;
  }

  private async getRequiredCategory() {
    const category = await this.categoryRepo.findOne({
      where: { name: HYDRO_CATEGORY_NAME },
    });
    if (!category) {
      throw new NotFoundException(
        `Категория "${HYDRO_CATEGORY_NAME}" не найдена`,
      );
    }
    return category;
  }

  private async getRequiredSource() {
    const source = await this.sourceRepo.findOne({
      where: { name: HYDRO_SOURCE_NAME },
    });
    if (!source) {
      throw new NotFoundException(`Источник "${HYDRO_SOURCE_NAME}" не найден`);
    }
    return source;
  }

  private async getRequiredMethod() {
    const method = await this.methodRepo.findOne({
      where: { name: METHOD_NAME },
    });
    if (!method) {
      throw new NotFoundException(`Метод "${METHOD_NAME}" не найден`);
    }
    return method;
  }

  private async getRequiredQcl() {
    const qcl = await this.qclRepo.findOne({ where: { name: QCL_NAME } });
    if (!qcl) {
      throw new NotFoundException(`QCL "${QCL_NAME}" не найден`);
    }
    return qcl;
  }

  private toDateOnly(value: Date | string | null) {
    return value ? new Date(value).toISOString().slice(0, 10) : null;
  }

  private addDays(date: string, days: number) {
    const value = new Date(`${date}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  private minDate(first: string, second: string) {
    return first < second ? first : second;
  }

  private async openShinySession(daterange?: [string, string]) {
    return new ShinyHydroSession(this.logger, daterange).connect();
  }
}

class ShinyHydroSession {
  private socket: WebSocket | null = null;
  private clientSeq = 0;
  private mapValue: unknown = null;
  private plotReady = false;
  private session?: { sessionId: string; workerId: string };
  private listeners: Array<(message: ShinyMessage) => void> = [];

  constructor(
    private readonly logger: Logger,
    private readonly daterange: [string, string] = [
      `${new Date().getFullYear()}-01-01`,
      new Date().toISOString().slice(0, 10),
    ],
  ) {}

  get sessionId() {
    if (!this.session?.sessionId) {
      throw new BadRequestException('Shiny session was not initialized');
    }
    return this.session.sessionId;
  }

  async connect() {
    const token = Math.random().toString(36).slice(2);
    const server = Math.floor(Math.random() * 1000);
    const session = Math.random().toString(36).slice(2);
    const url = `ws://ecodata.kz:3838/app_dg_map_ru/__sockjs__/n=${token}/${server}/${session}/websocket`;

    this.socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket was not created'));
      const timer = setTimeout(
        () => reject(new Error('ecodata timeout')),
        30000,
      );
      this.socket.onmessage = (event) => {
        const raw = String(event.data);
        if (raw === 'o') {
          this.sendRobust('o', '');
          this.sendRobust('m', JSON.stringify(this.createInitPayload()));
          clearTimeout(timer);
          resolve();
          return;
        }
        this.handleRawMessage(raw);
      };
      this.socket.onerror = () => reject(new Error('ecodata websocket error'));
    });

    return this;
  }

  async waitForMap(): Promise<unknown> {
    if (this.mapValue) return this.mapValue;
    return this.waitFor((message) => {
      if (message.values?.map) {
        this.mapValue = message.values.map;
        return this.mapValue;
      }
      return null;
    }, 45000);
  }

  async waitForPlot() {
    if (this.plotReady) return true;
    return this.waitFor((message) => {
      if (message.values?.plot || (message.errors && !message.errors.plot)) {
        this.plotReady = true;
        return true;
      }
      return null;
    }, 45000);
  }

  sendUpdate(data: Record<string, unknown>) {
    this.sendRobust('m', JSON.stringify({ method: 'update', data }));
  }

  close() {
    this.socket?.close();
  }

  private waitFor<T>(
    selector: (message: ShinyMessage) => T | null,
    timeoutMs: number,
  ) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners = this.listeners.filter((item) => item !== listener);
        reject(new BadRequestException('ecodata did not answer in time'));
      }, timeoutMs);
      const listener = (message: ShinyMessage) => {
        const selected = selector(message);
        if (selected) {
          clearTimeout(timer);
          this.listeners = this.listeners.filter((item) => item !== listener);
          resolve(selected);
        }
      };
      this.listeners.push(listener);
    });
  }

  private handleRawMessage(raw: string) {
    if (!raw.startsWith('a')) return;
    const frames = JSON.parse(raw.slice(1)) as string[];
    for (const frame of frames) {
      const id = frame.match(/^([0-9A-F]+)#/)?.[1];
      if (id) this.sendAck(id);

      const body = frame.split('|').slice(2).join('|');
      if (!body || body === 'ACK') continue;
      try {
        const message = JSON.parse(body) as ShinyMessage;
        if (message.config) this.session = message.config;
        if (message.values?.map) this.mapValue = message.values.map;
        if (message.values?.plot) this.plotReady = true;
        this.listeners.forEach((listener) => listener(message));
      } catch (error) {
        this.logger.debug(`Не удалось разобрать Shiny frame: ${String(error)}`);
      }
    }
  }

  private sendRobust(type: 'o' | 'm', payload: string) {
    const id = (this.clientSeq++).toString(16).toUpperCase();
    this.socket?.send(JSON.stringify([`${id}#0|${type}|${payload}`]));
  }

  private sendAck(id: string) {
    this.socket?.send(JSON.stringify([`ACK ${id}`]));
  }

  private createInitPayload() {
    return {
      method: 'init',
      data: {
        nav: 'Гидрологический мониторинг',
        value: 'level',
        year: String(new Date().getFullYear()),
        year_forecast: String(new Date().getFullYear()),
        year_pr: 'Предварительный',
        region: 'Акмолинская область',
        'daterange:shiny.date': this.daterange,
        '.clientdata_output_map_width': 696,
        '.clientdata_output_map_height': 750,
        '.clientdata_output_plot_width': 696,
        '.clientdata_output_plot_height': 600,
        '.clientdata_output_plot_bg': 'rgb(255, 255, 255)',
        '.clientdata_output_plot_fg': 'rgb(85, 85, 85)',
        '.clientdata_output_plot_accent': 'rgb(47, 164, 231)',
        '.clientdata_output_plot_font': {
          families: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
          size: '14px',
        },
        '.clientdata_output_map_hidden': false,
        '.clientdata_output_downloadData_hidden': false,
        '.clientdata_output_plot_hidden': false,
        '.clientdata_output_image1_hidden': true,
        '.clientdata_output_autumnpdf2_hidden': true,
        '.clientdata_output_autumnpdf3_hidden': true,
        '.clientdata_output_glubpdf4_hidden': true,
        '.clientdata_output_glubpdf5_hidden': true,
        '.clientdata_output_map_pr_hidden': true,
        '.clientdata_output_group5_hidden': true,
        '.clientdata_output_group6_hidden': true,
        '.clientdata_pixelratio': 1,
        '.clientdata_url_protocol': 'http:',
        '.clientdata_url_hostname': 'ecodata.kz',
        '.clientdata_url_port': '3838',
        '.clientdata_url_pathname': '/app_dg_map_ru/',
        '.clientdata_url_search': '',
        '.clientdata_url_hash_initial': '',
        '.clientdata_url_hash': '',
        '.clientdata_singletons': '',
      },
    };
  }
}
