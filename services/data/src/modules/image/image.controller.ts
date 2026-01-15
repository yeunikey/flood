import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return {
      statusCode: 200,
      data: await this.imageService.saveImage(file),
    };
  }

  @Get(':id')
  async getImage(@Param('id') id: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
