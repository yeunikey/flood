import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { AuthGuard } from './guards/auth.guard';
import CurrentUser from 'src/shared/decorators/user.decorator';
import type { JwtUser } from 'src/shared/decorators/user.decorator';
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
    return {
      statusCode: 200,
      data: this.userService.toSafeUser(
        await this.userService.findByIdSafe(jwtUser.id),
      ),
    };
  }

  @Post('login')
  async login(@Body() { login, password }: LoginDto) {
    const user = await this.userService.findByLoginSafe(login);
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Неверный логин или пароль');

    const payload = { id: user.id, role: user.role };

    return {
      statusCode: 200,
      data: {
        token: await this.jwtService.signAsync(payload),
        user: this.userService.toSafeUser(user),
      },
    };
  }
}
