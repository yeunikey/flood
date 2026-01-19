import { Module } from '@nestjs/common';
import { TilesService } from './tiles.service';
import { TilesController } from './tiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tile } from './entities/tile.entity';
import { TileserverManagerService } from './tileserver.manager';

@Module({
  controllers: [TilesController],
  providers: [TilesService, TileserverManagerService],
  imports: [TypeOrmModule.forFeature([Tile])],
})
export class TilesModule {}
