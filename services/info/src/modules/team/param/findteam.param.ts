import { IsNumberString } from "@nestjs/class-validator";

export class FindTeamParam {
    @IsNumberString()
    id: string;
}