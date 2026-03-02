import { Injectable } from "@nestjs/common";
import { DeepPartial, Repository } from "typeorm";
import { Team } from "./models/team.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class TeamService {

    constructor(
        @InjectRepository(Team)
        private teamRepo: Repository<Team>
    ) { }

    async find() {
        return await this.teamRepo.find({
            order: {
                priority: 'asc'
            }
        });
    }

    async findById(id: number) {
        return await this.teamRepo.findOneBy({
            id: id
        });
    }

    async save(team: DeepPartial<Team>) {
        return await this.teamRepo.save(team);
    }

    async delete(id: number) {
        return await this.teamRepo.delete(id);
    }
    async reorder(updates: { id: number, priority: number }[]) {
        const promises = updates.map(({ id, priority }) =>
            this.teamRepo.update({ id }, { priority })
        );
        await Promise.all(promises);
    }

}