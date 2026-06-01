import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';
import { Type } from '@nestjs/class-transformer';

export class DataRowDto {
  @IsString()
  date_utc: string;

  @IsNumber()
  siteId: number;

  @IsArray()
  variables: (number | null)[];

  @IsArray()
  values: unknown[];
}

export class UploadChunkPayloadDto {
  @IsNumber()
  qclId: number;

  @IsNumber()
  sourceId: number;

  @IsNumber()
  methodId: number;

  @IsNumber()
  categoryId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataRowDto)
  chunks: DataRowDto[];
}
