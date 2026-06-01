import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HecRas } from './entities/hec-ras.entity';
import { HecRasService } from './hec-ras.service';
import { HecRasController } from './hec-ras.controller';
import { HecRasDbService } from './services/hec-ras-db.service';

@Module({
  controllers: [HecRasController],
  providers: [HecRasService, HecRasDbService],
  imports: [TypeOrmModule.forFeature([HecRas])],
})
export class HecRasModule {}
