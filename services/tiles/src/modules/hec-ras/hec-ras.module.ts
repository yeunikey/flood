import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HecRas } from './entity/hec-ras.entity';
import { HecRasService } from './hec-ras.service';
import { HecRasController } from './hec-ras.controller';

@Module({
  controllers: [HecRasController],
  providers: [HecRasService],
  imports: [TypeOrmModule.forFeature([HecRas])],
})
export class HecRasModule {}
