import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private imageRepo: Repository<Image>,
  ) {}

  async saveImage(file: Express.Multer.File): Promise<Image> {
    const image = this.imageRepo.create({
      filename: file.originalname,
      data: file.buffer,
      mimetype: file.mimetype,
    });
    return this.imageRepo.save(image);
  }

  async getImage(id: string) {
    return this.imageRepo.findOneBy({ id: id });
  }

  async delete(id: string) {
    return this.imageRepo.delete(id);
  }
}
