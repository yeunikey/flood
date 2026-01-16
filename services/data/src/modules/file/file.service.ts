import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File as SavedFile } from './entities/file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(SavedFile)
    private fileRepo: Repository<SavedFile>,
  ) {}

  async saveFile(file: Express.Multer.File) {
    const obj = this.fileRepo.create({
      filename: file.originalname ?? file['name'],
      data: file.buffer,
      mimetype: file.mimetype,
    });
    return this.fileRepo.save(obj);
  }

  async getFile(id: string) {
    return this.fileRepo.findOneBy({ id: id });
  }

  async delete(id: string) {
    return this.fileRepo.delete(id);
  }
}
