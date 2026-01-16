import { IsString, IsArray, IsNumber } from '@nestjs/class-validator';
import { FeatureCollection } from 'geojson';

export class PoolCreateDto {
  @IsString()
  name: string;

  geojson: FeatureCollection;

  @IsArray()
  @IsNumber({}, { each: true })
  siteIds: number[];
}
