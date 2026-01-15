import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { DataModule } from './modules/data/data.module';
import { ImageModule } from './modules/image/image.module';
import { SitesModule } from './modules/sites/sites.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { VariableModule } from './modules/variable/variable.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    DataModule,
    ImageModule,
    SitesModule,
    MetadataModule,
    VariableModule,
    CacheModule.register({ ttl: 30 * 60 * 1000, isGlobal: true }),
  ],
})
export class AppModule {}
