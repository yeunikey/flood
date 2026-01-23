import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
} from '@nestjs/class-validator';
import { GradientConfigDto } from './gradient-config.dto';
import { Type } from '@nestjs/class-transformer';

export class SpatialStyleDto {
  @IsString()
  type: 'solid' | 'gradient';

  @IsString()
  borderColor: string;

  @IsNumber()
  borderWidth: number;

  @IsNumber()
  opacity: number;

  @IsOptional()
  @IsString()
  fillColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GradientConfigDto)
  gradient?: GradientConfigDto;
}
