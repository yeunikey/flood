import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNewDto } from './dto/create.dto';
import { New } from './models/new.entity';
import { UpdateNewDto } from './dto/update.dto';

@Injectable()
export class NewService {

    constructor(
        @InjectRepository(New)
        private readonly repo: Repository<New>,
    ) { }

    async create(dto: CreateNewDto): Promise<New> {
        return this.repo.save(dto);
    }

    async findAll(): Promise<New[]> {
        return this.repo.find({
            order: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id: number) {
        return this.repo.findOne({
            where: {
                id
            }
        });
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    async update(id: number, dto: UpdateNewDto): Promise<void> {
        await this.repo.update(id, dto);
    }


}
