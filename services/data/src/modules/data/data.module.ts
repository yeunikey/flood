import { Category } from './entities/category.entity';
import { DataController } from './data.controller';
import { DataGateway } from './data.gateway';
import { DataService } from './data.service';
import { DataSource } from '../metadata/entities/data_source.entity';
import { DataValue } from './entities/data_value.entity';
import { Group } from './entities/group';
import { MethodType } from '../metadata/entities/method_type.entity';
import { Module } from '@nestjs/common';
import { Qcl } from '../metadata/entities/qcl.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from '../variable/entities/unit.entity';
import { Variable } from '../variable/entities/variable.entity';
import { VariableController } from '../variable/variable.controller';
import { VariableService } from '../variable/variable.service';
import { SitesModule } from '../sites/sites.module';

@Module({
  controllers: [DataController, VariableController],
  providers: [DataService, VariableService, DataGateway],
  imports: [
    TypeOrmModule.forFeature([
      Category,
      DataSource,
      DataValue,
      MethodType,
      Qcl,
      Unit,
      Variable,
      Group,
    ]),
    SitesModule,
  ],
})
export class DataModule {}
