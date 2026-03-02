import { IsNumber, Min } from "@nestjs/class-validator";

export class TeamCreateDTO {

    private id?: number;

    private fullName: string;
    private position: string;

    private fullNameEn?: string;
    private positionEn?: string;

    private image: string;
    @IsNumber()
    @Min(0)
    private priority: number;

}