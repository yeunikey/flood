import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site';
import { SiteType } from './entities/site_type';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Site, SiteType])],
  providers: [SitesService],
  controllers: [SitesController],
  exports: [TypeOrmModule],
})
export class SitesModule {}
