import { Module } from '@nestjs/common';
import { TilesService } from './tiles.service';
import { TilesController } from './tiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tile } from './entities/tile.entity';
import { TileserverModule } from '../tileserver/tileserver.module';
import { TileStorageService } from './services/tile-storage.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Module({
  controllers: [TilesController],
  providers: [TilesService, TileStorageService, AuthGuard, EditorGuard],
  imports: [TypeOrmModule.forFeature([Tile]), TileserverModule],
})
export class TilesModule {}
