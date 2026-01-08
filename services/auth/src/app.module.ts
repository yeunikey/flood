import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';

@Module({
  imports: [DatabaseModule, ConfigurationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
