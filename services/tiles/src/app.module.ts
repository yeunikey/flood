import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { TilesModule } from './modules/tiles/tiles.module';
import { TileserverModule } from './modules/tileserver/tileserver.module';
import { HecRasModule } from './modules/hec-ras/hec-ras.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    TilesModule,
    TileserverModule,
    HecRasModule,
    CacheModule.register({ ttl: 30 * 60 * 1000, isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
})
export class AppModule {}
