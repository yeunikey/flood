import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageController } from './file.controller';
import { File } from './entities/file.entity';
import { FileService } from './file.service';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [ImageController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
