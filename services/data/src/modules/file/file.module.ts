import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageController } from './file.controller';
import { File } from './entities/file.entity';
import { FileService } from './file.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [ImageController],
  providers: [FileService, AuthGuard, EditorGuard],
  exports: [FileService],
})
export class FileModule {}
