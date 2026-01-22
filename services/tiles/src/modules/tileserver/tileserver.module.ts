import { Module } from '@nestjs/common';
import { TileserverService } from './tileserver.service';
import { TileserverController } from './tileserver.controller';

@Module({
  controllers: [TileserverController],
  providers: [TileserverService],
  exports: [TileserverService],
})
export class TileserverModule {}
