import { IsOptional, IsString } from '@nestjs/class-validator';

export class ImportHydroSiteDto {
  @IsString()
  siteCode: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
