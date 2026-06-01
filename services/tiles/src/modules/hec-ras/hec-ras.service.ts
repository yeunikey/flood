import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { HecRas } from './entities/hec-ras.entity';
import { HecRasDbService } from './services/hec-ras-db.service';

@Injectable()
export class HecRasService implements OnModuleInit, OnModuleDestroy {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'hec-ras');

  constructor(
    @InjectRepository(HecRas)
    private projectRepository: Repository<HecRas>,
    private readonly hecRasDb: HecRasDbService,
  ) {}

  onModuleInit() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  onModuleDestroy() {
    this.hecRasDb.closeAll();
  }

  getTransparentTile(): Buffer {
    return this.hecRasDb.getTransparentTile();
  }

  async getAllProjects() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.projectRepository.find({ order: { createdAt: 'DESC' } }),
    };
  }

  async getStats() {
    const [total, latest] = await Promise.all([
      this.projectRepository.count(),
      this.projectRepository.findOne({
        select: {
          id: true,
          name: true,
          originalFilename: true,
          createdAt: true,
        },
        where: {},
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: {
        total,
        latestProject: latest
          ? {
              id: latest.id,
              name: latest.name,
              originalFilename: latest.originalFilename,
              createdAt: latest.createdAt.toISOString(),
            }
          : null,
      },
    };
  }

  async uploadProject(
    file: Express.Multer.File,
    name: string,
  ): Promise<HecRas> {
    const project = this.projectRepository.create({
      name,
      originalFilename: file.originalname,
      dbPath: '',
    });

    const savedProject = await this.projectRepository.save(project);
    const newFilename = `${savedProject.id}.db`;
    const newPath = join(this.uploadDir, newFilename);

    renameSync(file.path, newPath);

    savedProject.dbPath = newPath;
    return this.projectRepository.save(savedProject);
  }

  async deleteProject(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    const dbPath = project.dbPath;
    this.hecRasDb.close(dbPath);

    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }

    await this.projectRepository.remove(project);
  }

  getMetadata(id: string) {
    return this.hecRasDb.getMetadata(id);
  }

  getTimes(id: string) {
    return this.hecRasDb.getTimes(id);
  }

  getTile(
    id: string,
    z: number,
    x: number,
    y: number,
    time?: string,
    useTms = false,
  ): Buffer | null {
    return this.hecRasDb.getTile(id, z, x, y, time, useTms);
  }
}
