import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
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

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  hecRasIds?: string[];
}
