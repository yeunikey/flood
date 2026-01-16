import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tile } from './entities/tile.entity';

@Injectable()
export class TilesService {

    constructor(
        @InjectRepository(Tile)
        private tilesRepository: Repository<Tile>,
    ) { }

    async saveTile(tileData: Partial<Tile>): Promise<Tile> {
        const tile = this.tilesRepository.create(tileData);
        return this.tilesRepository.save(tile);
    }

    async getAllTiles(): Promise<Tile[]> {
        return this.tilesRepository.find();
    }

    private async findTile(uuid: string): Promise<Tile> {
        const tile = await this.tilesRepository.findOne({ where: { id: uuid } });
        if (!tile) throw new Error('Tile not found');
        return tile;
    }

}
