import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpatialDto } from './dto/create-spatial.dto';
import { Spatial } from './entity/spatial.entity';
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

  async create(dto: CreateSpatialDto): Promise<Spatial> {
    const spatial = this.spatialRepository.create({
      name: dto.name,
      tileIds: dto.tileIds,
      style: dto.style,
      legend: dto.legend,
      pool: dto.poolId ? { id: dto.poolId } : null,
    });

    return this.spatialRepository.save(spatial);
  }

  async findAll() {
    return this.spatialRepository.find({
      relations: ['pool'],
    });
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
}
