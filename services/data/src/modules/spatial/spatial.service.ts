import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpatialDto } from './dto/create-spatial.dto';
import { Spatial, SpatialLegend } from './entities/spatial.entity';
import { TilesClient } from './grpc/tiles.client';
import { Tile } from './grpc/tile.grpc';
import type { SpatialStats } from '../data/types/data.types';

@Injectable()
export class SpatialService {
  private readonly logger = new Logger(SpatialService.name);

  constructor(
    @InjectRepository(Spatial)
    private spatialRepository: Repository<Spatial>,
    private tilesClient: TilesClient,
  ) {}

  private async getTiles(tileIds?: string[] | null): Promise<Tile[]> {
    if (!tileIds?.length) {
      return [];
    }

    return this.tilesClient.getTilesByIds(tileIds);
  }

  async create(dto: CreateSpatialDto) {
    const spatial = this.spatialRepository.create({
      name: dto.name,
      tileIds: dto.tileIds,
      style: dto.style,
      legend: dto.legend,
      pool: dto.poolId ? { id: dto.poolId } : null,
    });

    const savedSpatial = await this.spatialRepository.save(spatial);

    let tiles: Tile[] = [];
    try {
      tiles = await this.getTiles(savedSpatial.tileIds);
    } catch (e) {
      this.logger.error('Failed to fetch tiles during creation', e);
    }

    return {
      spatial: savedSpatial,
      tiles,
    };
  }

  async findAll() {
    const spatials = await this.spatialRepository.find({
      relations: ['pool'],
    });

    const result = await Promise.all(
      spatials.map(async (spatial) => {
        let tiles: Tile[] = [];
        try {
          tiles = await this.getTiles(spatial.tileIds);
        } catch (e) {
          this.logger.error(
            `Failed to fetch tiles for spatial ${spatial.id}`,
            e,
          );
        }

        return {
          spatial,
          tiles,
        };
      }),
    );

    return result;
  }

  async getStats(): Promise<SpatialStats> {
    const [stats] = await this.spatialRepository.query<
      {
        total: string;
        tiles: string;
        withLegend: string;
        linkedToPools: string;
        solidStyle: string;
        gradientStyle: string;
      }[]
    >(`
      SELECT
        COUNT(*)::int AS "total",
        COALESCE(
          SUM(
            CASE
              WHEN "tileIds" IS NULL OR "tileIds" = '' THEN 0
              ELSE cardinality(string_to_array("tileIds", ','))
            END
          ),
          0
        )::int AS "tiles",
        COUNT(*) FILTER (WHERE legend IS NOT NULL AND (legend->>'enabled')::boolean IS TRUE)::int AS "withLegend",
        COUNT(*) FILTER (WHERE "poolId" IS NOT NULL)::int AS "linkedToPools",
        COUNT(*) FILTER (WHERE style->>'type' = 'solid')::int AS "solidStyle",
        COUNT(*) FILTER (WHERE style->>'type' = 'gradient')::int AS "gradientStyle"
      FROM spatial
    `);

    return {
      total: Number(stats?.total ?? 0),
      tiles: Number(stats?.tiles ?? 0),
      withLegend: Number(stats?.withLegend ?? 0),
      linkedToPools: Number(stats?.linkedToPools ?? 0),
      solidStyle: Number(stats?.solidStyle ?? 0),
      gradientStyle: Number(stats?.gradientStyle ?? 0),
    };
  }

  async getSummaryList() {
    const spatials = await this.spatialRepository.find({
      select: {
        id: true,
        name: true,
        tileIds: true,
        style: true,
        legend: true,
        pool: {
          id: true,
          name: true,
        },
      },
      relations: {
        pool: true,
      },
      order: { name: 'ASC' },
    });

    return spatials.map((spatial) => ({
      id: spatial.id,
      name: spatial.name,
      tilesCount: spatial.tileIds?.length ?? 0,
      styleType: spatial.style?.type ?? '',
      legendEnabled: spatial.legend?.enabled ?? false,
      poolName: spatial.pool?.name ?? null,
    }));
  }

  async findOne(id: number) {
    const spatial = await this.spatialRepository.findOne({
      where: { id },
      relations: ['pool'],
    });

    if (!spatial) return null;

    let tilesData: Tile[] = [];
    try {
      tilesData = await this.getTiles(spatial.tileIds);
    } catch (e) {
      this.logger.error(`Failed to fetch tiles for spatial ${id}`, e);
    }

    return {
      ...spatial,
      tiles: tilesData,
    };
  }

  async remove(id: number) {
    const result = await this.spatialRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Spatial with ID ${id} not found`);
    }
    return { deleted: true };
  }

  async update(id: number, dto: CreateSpatialDto) {
    const spatial = await this.spatialRepository.findOne({ where: { id } });
    if (!spatial) {
      throw new NotFoundException(`Spatial with ID ${id} not found`);
    }

    spatial.name = dto.name;
    spatial.tileIds = dto.tileIds;
    spatial.style = dto.style;

    spatial.legend = dto.legend as SpatialLegend;

    if (dto.poolId) {
      spatial.pool = { id: dto.poolId } as unknown as Spatial['pool'];
    } else {
      spatial.pool = null;
    }

    const updatedSpatial = await this.spatialRepository.save(spatial);

    let tiles: Tile[] = [];
    try {
      tiles = await this.getTiles(updatedSpatial.tileIds);
    } catch (e) {
      this.logger.error(`Failed to fetch tiles for spatial ${id}`, e);
    }

    return {
      spatial: updatedSpatial,
      tiles,
    };
  }
}
