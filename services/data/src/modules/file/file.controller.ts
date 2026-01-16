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
import { FileService } from './file.service';

@Controller('files')
export class ImageController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return {
      statusCode: 200,
      data: await this.fileService.saveFile(file),
    };
  }

  @Get(':id')
  async getImage(@Param('id') id: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Некорректный UUID');
    }

    const file = await this.fileService.getFile(id);

    if (!file) {
      throw new NotFoundException('Изображение не найдено');
    }

    return new StreamableFile(file.data, {
      type: file.mimetype,
      disposition: `inline; filename="${file.filename}"`,
      length: file.data.length,
    });
  }
}
