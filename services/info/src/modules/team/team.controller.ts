import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "src/auth/auth.guard";
import { TeamCreateDTO } from "./dto/teamcreate.dto";
import { TeamService } from "./team.service";
import { AuthRequest } from "src/types";
import { UserService } from "src/users/user.service";

@Controller('team')
export class TeamController {

    constructor(
        private teamService: TeamService,
        private userService: UserService
    ) { }

    @Post('/reorder')
    @UseGuards(AuthGuard)
    async reorder(@Body() updates: { id: number, priority: number }[], @Req() { user: { id: user_id } }: AuthRequest) {

        const user = await this.userService.findById(user_id);

        if (!user) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                message: "У вас нет прав"
            }
        }

        await this.teamService.reorder(updates);

        return { statusCode: HttpStatus.OK };
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@Body() body: TeamCreateDTO) {
        return {
            statusCode: HttpStatus.OK,
            data: await this.teamService.save(body)
        }
    }

    @Get()
    async all() {
        return {
            statusCode: HttpStatus.OK,
            data: await this.teamService.find()
        }
    }

    @Get('/:id')
    async find(@Param('id') id: number) {

        const team = await this.teamService.findById(id);

        if (!team) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "Не известный член команды"
            }
        }

        return {
            statusCode: HttpStatus.OK,
            data: team
        }

    }

    @Delete('/:id')
    async delete(@Param('id') id: number) {

        await this.teamService.delete(id);

        return {
            statusCode: HttpStatus.OK,
        }

    }

}