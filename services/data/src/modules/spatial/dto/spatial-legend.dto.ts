import { Type } from '@nestjs/class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';
import { LegendItemDto } from './legend-item.dto';

export class SpatialLegendDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegendItemDto)
  items: LegendItemDto[];
}
