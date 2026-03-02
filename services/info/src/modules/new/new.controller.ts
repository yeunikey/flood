import { Controller, Post, Body, Get, Param, Delete, UseGuards, HttpStatus, Req } from '@nestjs/common';
import { NewService } from './new.service';
import { CreateNewDto } from './dto/create.dto';
import { UpdateNewDto } from './dto/update.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthRequest } from 'src/types';
import { UserService } from 'src/users/user.service';

@Controller('news')
export class NewController {
    constructor(
        private readonly service: NewService,
        private userService: UserService
    ) { }

    @Post()
    @UseGuards(AuthGuard)
    async create(@Body() dto: CreateNewDto, @Req() { user: { id: user_id } }: AuthRequest) {

        const user = await this.userService.findById(user_id);

        if (!user) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                message: "У вас нет прав"
            }
        }

        return this.service.create(dto);
    }

    @Post('/:id')
    @UseGuards(AuthGuard)
    async update(@Param('id') id: string, @Body() dto: UpdateNewDto, @Req() { user: { id: user_id } }: AuthRequest) {

        const user = await this.userService.findById(user_id);

        if (!user) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                message: "У вас нет прав"
            }
        }

        return this.service.update(+id, dto);
    }

    @Get()
    async findAll() {
        return {
            statusCode: 200,
            data: await this.service.findAll()
        };
    }

    @Get(':id')
    async findById(@Param('id') id: number,) {
        return {
            statusCode: 200,
            data: await this.service.findById(id)
        };
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async remove(@Param('id') id: string, @Req() { user: { id: user_id } }: AuthRequest) {

        const user = await this.userService.findById(user_id);

        if (!user) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                message: "У вас нет прав"
            }
        }

        await this.service.remove(+id);

        return {
            statusCode: 200
        };
    }

}
