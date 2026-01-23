import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Pool } from './entities/pool.entity';
import type { FeatureCollection } from 'geojson';
import { Site } from '../sites/entities/site';
import { Spatial } from '../spatial/entity/spatial.entity';

@Injectable()
export class PoolService {
  constructor(
    @InjectRepository(Pool)
    private poolRepository: Repository<Pool>,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Spatial)
    private spatialRepository: Repository<Spatial>,
  ) {}

  async findAll() {
    return this.poolRepository.find({
      relations: ['sites', 'spatials'],
    });
  }

  async findById(id: number) {
    return this.poolRepository.findOne({
      where: { id },
      relations: ['sites', 'spatials'],
    });
  }

  async create(
    name: string,
    geojson: FeatureCollection,
    siteIds: number[],
    spatialIds?: number[],
  ) {
    const pool = await this.poolRepository.save({
      name,
      geojson,
    });

    if (siteIds?.length) {
      await this.siteRepository.update({ id: In(siteIds) }, { pool });
    }

    if (spatialIds?.length) {
      await this.spatialRepository.update({ id: In(spatialIds) }, { pool });
    }

    return this.findById(pool.id);
  }

  async update(
    pool: Pool,
    name?: string,
    geojson?: FeatureCollection,
    siteIds?: number[],
    spatialIds?: number[],
  ) {
    if (name !== undefined) pool.name = name;
    if (geojson !== undefined) pool.geojson = geojson;

    await this.poolRepository.save(pool);

    // Update Sites
    if (siteIds) {
      await this.siteRepository.update(
        { pool: { id: pool.id } },
        { pool: null },
      );

      if (siteIds.length) {
        await this.siteRepository.update({ id: In(siteIds) }, { pool });
      }
    }

    // Update Spatials
    if (spatialIds) {
      await this.spatialRepository.update(
        { pool: { id: pool.id } },
        { pool: null },
      );

      if (spatialIds.length) {
        await this.spatialRepository.update({ id: In(spatialIds) }, { pool });
      }
    }

    return this.findById(pool.id);
  }

  async delete(pool: Pool) {
    await this.siteRepository.update({ pool: { id: pool.id } }, { pool: null });

    await this.spatialRepository.update(
      { pool: { id: pool.id } },
      { pool: null },
    );

    return this.poolRepository.remove(pool);
  }
}
