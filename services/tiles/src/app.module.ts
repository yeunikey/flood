import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TilesModule } from './modules/tiles/tiles.module';
import { TileserverModule } from './modules/tileserver/tileserver.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    TilesModule,
    TileserverModule,
    CacheModule.register({ ttl: 30 * 60 * 1000, isGlobal: true }),
  ],
})
export class AppModule {}
