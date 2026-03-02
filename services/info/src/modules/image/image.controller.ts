import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, BadRequestException, NotFoundException, StreamableFile, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthRequest } from 'src/types';
import { UserService } from 'src/users/user.service';

@Controller('images')
export class ImageController {
    constructor(
        private readonly imageService: ImageService,
        private userService: UserService
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @UseGuards(AuthGuard)
    async upload(@UploadedFile() file: Express.Multer.File, @Req() { user: { id: user_id } }: AuthRequest) {

        const user = await this.userService.findById(user_id);

        if (!user) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                message: "У вас нет прав"
            }
        }

        return {
            statusCode: 200,
            data: await this.imageService.saveImage(file)
        };
    }

    @Get(':id')
    async getImage(@Param('id') id: string) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(id)) {
            throw new BadRequestException('Некорректный UUID');
        }

        const image = await this.imageService.getImage(id);

        if (!image) {
            throw new NotFoundException('Изображение не найдено');
        }

        return new StreamableFile(image.data, {
            type: image.mimetype,
            disposition: `inline; filename="${image.filename}"`,
            length: image.data.length,
        });
    }


}
