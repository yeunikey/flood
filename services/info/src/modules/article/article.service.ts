import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article } from './models/article';

@Injectable()
export class ArticleService {

    constructor(
        @InjectRepository(Article)
        private readonly repo: Repository<Article>,
    ) { }

    async create(dto: CreateArticleDto): Promise<Article> {
        const article = this.repo.create(dto);
        return this.repo.save(article);
    }

    findAll(): Promise<Article[]> {
        return this.repo.find();
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    async update(id: number, dto: Partial<CreateArticleDto>) {
        await this.repo.update(id, dto);
        return this.repo.findOneBy({ id });
    }


}
