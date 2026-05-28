import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydroParserController } from './hydro-parser.controller';
import { HydroParserService } from './hydro-parser.service';
import {
  Category,
  DataSourceEntity,
  DataValue,
  Group,
  MethodType,
  Qcl,
  Site,
  SiteType,
  Unit,
  Variable,
} from './entities/hydro-parser.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Site,
      SiteType,
      Category,
      MethodType,
      Qcl,
      DataSourceEntity,
      Unit,
      Variable,
      Group,
      DataValue,
    ]),
  ],
  controllers: [HydroParserController],
  providers: [HydroParserService],
})
export class HydroParserModule {}
