import { Article } from './models/article';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Article])],
    providers: [ArticleService],
    controllers: [ArticleController],
})
export class ArticleModule { }
