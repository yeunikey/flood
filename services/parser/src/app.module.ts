import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { HydroParserModule } from './modules/hydro-parser/hydro-parser.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    CacheModule.register({ ttl: 30 * 60 * 1000, isGlobal: true }),
    HydroParserModule,
  ],
})
export class AppModule {}
