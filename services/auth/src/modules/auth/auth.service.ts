import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { JwtUser } from 'src/shared/decorators/user.decorator';
import { ok } from 'src/shared/utils/api-response';
import { UserService } from '../users/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async getProfile(jwtUser: JwtUser) {
    return ok(
      this.userService.toSafeUser(
        await this.userService.findByIdSafe(jwtUser.id),
      ),
    );
  }

  async login({ login, password }: LoginDto) {
    const user = await this.userService.findByLoginSafe(login);
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Неверный логин или пароль');

    const payload = { id: user.id, role: user.role };

    return ok({
      token: await this.jwtService.signAsync(payload),
      user: this.userService.toSafeUser(user),
    });
  }
}
