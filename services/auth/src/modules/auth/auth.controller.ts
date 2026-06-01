import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import CurrentUser from 'src/shared/decorators/user.decorator';
import type { JwtUser } from 'src/shared/decorators/user.decorator';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../users/user.service';

@Controller('')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async profile(@CurrentUser() jwtUser: JwtUser) {
    return this.authService.getProfile(jwtUser);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard)
  @Get('api-key')
  async apiKeyInfo(@CurrentUser() jwtUser: JwtUser) {
    return this.userService.getApiKeyInfo(jwtUser.id);
  }

  @UseGuards(AuthGuard)
  @Post('api-key')
  async regenerateApiKey(@CurrentUser() jwtUser: JwtUser) {
    return this.userService.regenerateApiKey(jwtUser.id);
  }
}
