import { IsOptional, IsString } from '@nestjs/class-validator';

export class ExportCsvDto {
  @IsString()
  siteCode: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
