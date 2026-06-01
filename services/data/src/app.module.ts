import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { DataModule } from './modules/data/data.module';
import { ImageModule } from './modules/image/image.module';
import { SitesModule } from './modules/sites/sites.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { VariableModule } from './modules/variable/variable.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { FileModule } from './modules/file/file.module';
import { JwtModule } from '@nestjs/jwt';
import { PoolModule } from './modules/pools/pools.module';
import { SpatialModule } from './modules/spatial/spatial.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    DataModule,
    ImageModule,
    SitesModule,
    MetadataModule,
    VariableModule,
    FileModule,
    PoolModule,
    SpatialModule,
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
