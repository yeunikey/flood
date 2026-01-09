import { IsNotEmpty, IsString, IsOptional } from '@nestjs/class-validator';

export class RegisterDto {
  @IsString()
  login: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  image?: string;
}
