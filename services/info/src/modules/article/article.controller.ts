import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('articles')
export class ArticleController {

    constructor(private readonly service: ArticleService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Post()
    @UseGuards(AuthGuard)
    create(@Body() dto: CreateArticleDto) {
        return this.service.create(dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }

    @Post(':id')
    @UseGuards(AuthGuard)
    update(@Param('id') id: string, @Body() dto: CreateArticleDto) {
        return this.service.update(+id, dto);
    }

}
