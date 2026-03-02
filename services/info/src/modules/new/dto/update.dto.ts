import { IsOptional, IsString } from 'class-validator';

export class UpdateNewDto {
    
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    imageId?: string;

    @IsOptional()
    @IsString()
    content?: string;
}
