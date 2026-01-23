import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
} from '@nestjs/class-validator';
import { FeatureCollection } from 'geojson';

export class PoolCreateDto {
  @IsString()
  name: string;

  geojson: FeatureCollection;

  @IsArray()
  @IsNumber({}, { each: true })
  siteIds: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  spatialIds?: number[];
}
