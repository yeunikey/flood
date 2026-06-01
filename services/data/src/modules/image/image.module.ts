import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Image])],
  controllers: [ImageController],
  providers: [ImageService, AuthGuard, EditorGuard],
  exports: [ImageService],
})
export class ImageModule {}
