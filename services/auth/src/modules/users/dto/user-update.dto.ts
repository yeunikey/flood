import { IsOptional, IsString, IsEmail } from '@nestjs/class-validator';

export class UserUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEmail()
  email?: string; // если хочешь разрешить менять email

  @IsOptional()
  @IsString()
  image?: string;
}
