import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';
import { SpatialStyleDto } from './spatial-style.dto';
import { SpatialLegendDto } from './spatial-legend.dto';
import { Type } from '@nestjs/class-transformer';

export class CreateSpatialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  tileIds: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => SpatialStyleDto)
  style: SpatialStyleDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SpatialLegendDto)
  legend?: SpatialLegendDto;

  @IsOptional()
  @IsNumber()
  poolId?: number;
}
