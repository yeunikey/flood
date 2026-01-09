import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class LoginDto {
  @IsString()
  login: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
