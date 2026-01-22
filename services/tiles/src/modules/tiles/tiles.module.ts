import { Module } from '@nestjs/common';
import { TilesService } from './tiles.service';
import { TilesController } from './tiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tile } from './entities/tile.entity';
import { TileserverModule } from '../tileserver/tileserver.module';

@Module({
  controllers: [TilesController],
  providers: [TilesService],
  imports: [TypeOrmModule.forFeature([Tile]), TileserverModule],
})
export class TilesModule {}
