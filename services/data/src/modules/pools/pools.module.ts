import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pool } from './entities/pool.entity';
import { PoolService } from './pool.service';
import { PoolController } from './pool.controller';
import { FileModule } from '../file/file.module';
import { Site } from '../sites/entities/site';

@Module({
  imports: [TypeOrmModule.forFeature([Pool, Site]), FileModule],
  providers: [PoolService],
  controllers: [PoolController],
  exports: [PoolService],
})
export class PoolModule {}
