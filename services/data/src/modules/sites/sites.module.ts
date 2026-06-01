import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site';
import { SiteType } from './entities/site_type';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Site, SiteType])],
  providers: [SitesService, AuthGuard, EditorGuard],
  controllers: [SitesController],
  exports: [TypeOrmModule],
})
export class SitesModule {}
