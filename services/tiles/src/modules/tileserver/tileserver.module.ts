import { Module } from '@nestjs/common';
import { TileserverService } from './tileserver.service';
import { TileserverController } from './tileserver.controller';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Module({
  controllers: [TileserverController],
  providers: [TileserverService, AuthGuard],
  exports: [TileserverService],
})
export class TileserverModule {}
