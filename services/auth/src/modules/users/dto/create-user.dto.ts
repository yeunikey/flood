import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['viewer', 'editor', 'admin'])
  role: UserRole;
}
