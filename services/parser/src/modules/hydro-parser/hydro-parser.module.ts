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
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

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
  providers: [HydroParserService, AuthGuard, EditorGuard],
})
export class HydroParserModule {}
