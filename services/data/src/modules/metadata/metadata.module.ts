import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from './entities/data_source.entity';
import { MethodType } from './entities/method_type.entity';
import { Qcl } from './entities/qcl.entity';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Module({
  controllers: [MetadataController],
  providers: [MetadataService, AuthGuard, EditorGuard],
  imports: [TypeOrmModule.forFeature([DataSource, MethodType, Qcl])],
})
export class MetadataModule {}
