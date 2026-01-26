import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpatialDto } from './dto/create-spatial.dto';
import { Spatial, SpatialLegend } from './entity/spatial.entity';
import { TilesClient } from './grpc/tiles.client';
import { Tile } from './grpc/tile.grpc';

@Injectable()
export class SpatialService {
  private readonly logger = new Logger(SpatialService.name);

  constructor(
    @InjectRepository(Spatial)
    private spatialRepository: Repository<Spatial>,
    private tilesClient: TilesClient,
  ) {}

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
    if (savedSpatial.tileIds && savedSpatial.tileIds.length > 0) {
      try {
        tiles = await this.tilesClient.getTilesByIds(savedSpatial.tileIds);
      } catch (e) {
        this.logger.error('Failed to fetch tiles during creation', e);
      }
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
        if (spatial.tileIds && spatial.tileIds.length > 0) {
          try {
            tiles = await this.tilesClient.getTilesByIds(spatial.tileIds);
          } catch (e) {
            this.logger.error(
              `Failed to fetch tiles for spatial ${spatial.id}`,
              e,
            );
          }
        }

        return {
          spatial,
          tiles,
        };
      }),
    );

    return result;
  }

  async findOne(id: number) {
    const spatial = await this.spatialRepository.findOne({
      where: { id },
      relations: ['pool'],
    });

    if (!spatial) return null;

    let tilesData: Tile[] = [];
    if (spatial.tileIds && spatial.tileIds.length > 0) {
      try {
        tilesData = await this.tilesClient.getTilesByIds(spatial.tileIds);
      } catch (e) {
        this.logger.error(`Failed to fetch tiles for spatial ${id}`, e);
      }
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
    if (updatedSpatial.tileIds && updatedSpatial.tileIds.length > 0) {
      try {
        tiles = await this.tilesClient.getTilesByIds(updatedSpatial.tileIds);
      } catch (e) {
        this.logger.error(`Failed to fetch tiles for spatial ${id}`, e);
      }
    }

    return {
      spatial: updatedSpatial,
      tiles,
    };
  }
}
