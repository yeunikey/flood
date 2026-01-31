import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
} from '@nestjs/class-validator';
import type { FeatureCollection } from 'geojson';

export class PoolUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  geojson?: FeatureCollection;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  siteIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  spatialIds?: number[];
}
