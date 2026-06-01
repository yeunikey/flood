import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pool } from './entities/pool.entity';
import { PoolService } from './pool.service';
import { PoolController } from './pool.controller';
import { FileModule } from '../file/file.module';
import { Site } from '../sites/entities/site';
import { Spatial } from '../spatial/entities/spatial.entity';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Pool, Site, Spatial]), FileModule],
  providers: [PoolService, AuthGuard, EditorGuard],
  controllers: [PoolController],
  exports: [PoolService],
})
export class PoolModule {}
