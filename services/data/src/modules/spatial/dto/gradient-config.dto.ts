import { IsString } from '@nestjs/class-validator';

export class GradientConfigDto {
  @IsString()
  variable: string;

  @IsString()
  minColor: string;

  @IsString()
  maxColor: string;
}
