import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { JwtUser } from 'src/shared/decorators/user.decorator';
import { UserUpdateDto } from './dto/user-update.dto';
import CurrentUser from 'src/shared/decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getPublicUserById(id);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(@CurrentUser() user: JwtUser) {
    return this.userService.deleteById(user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async update(@CurrentUser() user: JwtUser, @Body() dto: UserUpdateDto) {
    return this.userService.updateProfile(user.id, dto);
  }
}
