import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { AuthGuard } from './guards/auth.guard';
import CurrentUser from 'src/shared/decorators/user.decorator';
import type { JwtUser } from 'src/shared/decorators/user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('')
export class AuthController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async profile(@CurrentUser() jwtUser: JwtUser) {
    return await this.userService.findByIdSafe(jwtUser.id);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const contains = await this.userService.findByLoginSafe(body.login);

    if (contains) {
      return {
        statusCode: HttpStatus.FOUND,
        message: 'Такой юзер уже существует',
      };
    }

    const password = await bcrypt.hash(body.password, 10);
    const user = await this.userService.saveUser({
      ...body,
      password: password,
    });

    return {
      statusCode: 200,
      data: {
        token: await this.jwtService.signAsync(
          this.userService.toSafeUser(user),
        ),
        user: user,
      },
    };
  }

  @Post('login')
  async login(@Body() { login, password }: LoginDto) {
    const user = await this.userService.findByLoginSafe(login);

    if (!user) {
      return {
        statusCode: 400,
        message: 'Такого юзера не существует',
      };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return {
        statusCode: 400,
        message: 'Неправильный пароль',
      };
    }

    const payload = {
      id: user.id,
    };

    return {
      statusCode: 200,
      data: {
        token: await this.jwtService.signAsync(payload),
        user: user,
      },
    };
  }
}
