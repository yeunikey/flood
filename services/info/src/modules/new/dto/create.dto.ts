import { IsString } from "@nestjs/class-validator";

export class CreateNewDto {
    @IsString()
    title: string;
    @IsString()
    content: string; // markdown
    @IsString()
    imageId: string; // UUID
}
