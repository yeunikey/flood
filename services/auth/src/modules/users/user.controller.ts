import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import CurrentUser from 'src/shared/decorators/user.decorator';
import type { JwtUser } from 'src/shared/decorators/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll(@CurrentUser() user: JwtUser) {
    if (user.role !== 'admin')
      throw new ForbiddenException('Только для админов');
    return this.userService.getAllUsers();
  }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateUserDto) {
    if (user.role !== 'admin')
      throw new ForbiddenException('Только для админов');
    return this.userService.createUser(dto);
  }

  @Patch(':id/role')
  async updateRole(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    if (user.role !== 'admin')
      throw new ForbiddenException('Только для админов');
    return this.userService.updateRole(id, dto.role);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (user.role !== 'admin')
      throw new ForbiddenException('Только для админов');
    if (user.id === id) throw new ForbiddenException('Нельзя удалить себя');
    return this.userService.deleteById(id);
  }
}
