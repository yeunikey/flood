import { Image } from './entities/image.entity';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/users/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Image]),
        UserModule
    ],
    controllers: [ImageController],
    providers: [ImageService],
    exports: [
        ImageService
    ]
})
export class ImageModule { }
