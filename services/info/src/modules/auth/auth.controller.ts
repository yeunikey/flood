import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { UserService } from 'src/users/user.service';
import { AuthRequest } from 'src/types';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {

    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) { }

    @UseGuards(AuthGuard)
    @Get('profile')
    async profile(@Request() req: AuthRequest) {
        return {
            statusCode: 200,
            data: {
                ...await this.userService.findById(req.user.id),
                password: undefined
            },
        };
    }

    @Post('login')
    async login(@Body() { login, password }: LoginDTO) {

        const user = await this.userService.findByLogin(login);

        if (!user) {
            return {
                statusCode: 400,
                message: "Такого юзера не существует"
            };
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return {
                statusCode: 400,
                message: "Неправильный пароль"
            };
        }

        const payload = {
            id: user.id,
        };

        return {
            statusCode: 200,
            data: {
                token: await this.jwtService.signAsync(payload),
                user: user
            }
        };
    }

}
