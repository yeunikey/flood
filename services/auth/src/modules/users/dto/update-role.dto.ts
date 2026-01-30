import { IsEnum } from 'class-validator';
import type { UserRole } from '../entities/user.entity';

export class UpdateRoleDto {
  @IsEnum(['viewer', 'editor', 'admin'])
  role: UserRole;
}
