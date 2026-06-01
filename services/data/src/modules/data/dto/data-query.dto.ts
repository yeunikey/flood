import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from '@nestjs/class-validator';

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOptionalInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class SourceQueryDto {
  @IsOptional()
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @IsPositive()
  sourceId?: number;
}

export class CategoryVariablesQueryDto extends SourceQueryDto {
  @IsOptional()
  @IsString()
  siteCode?: string;
}

export class PaginationQueryDto extends SourceQueryDto {
  @Transform(({ value }) => toPositiveInt(value, 1))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => toPositiveInt(value, 20))
  @IsInt()
  @Min(1)
  limit = 20;
}

export class DatePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;
}
