import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class LegendItemDto {
  @IsNotEmpty()
  value: string | number;

  @IsString()
  color: string;

  @IsString()
  label: string;
}
