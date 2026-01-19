import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TilesModule } from './modules/tiles/tiles.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    TilesModule,
    CacheModule.register({ ttl: 30 * 60 * 1000, isGlobal: true }),
  ],
})
export class AppModule {}
