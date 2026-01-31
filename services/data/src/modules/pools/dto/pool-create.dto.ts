import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
} from '@nestjs/class-validator';
import type { FeatureCollection } from 'geojson';

export class PoolCreateDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  geojson: FeatureCollection;

  @IsArray()
  @IsNumber({}, { each: true })
  siteIds: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  spatialIds?: number[];
}
