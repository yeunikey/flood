import { IsOptional, IsString, IsUUID } from '@nestjs/class-validator';

export class CreateTileDto {
  @IsOptional()
  @IsUUID('4', { message: 'tileUUID должен быть валидным UUID v4' })
  tileUUID?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
