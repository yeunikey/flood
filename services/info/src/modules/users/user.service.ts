import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { User } from "./models/user.entity";

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findById(id: number) {
        return await this.userRepository.findOneBy({
            id: id
        });
    }

    async findByLogin(login: string) {
        return await this.userRepository.findOneBy({
            login
        });
    }

    async save(user: DeepPartial<User>) {
        return await this.userRepository.save(user);
    }

    async delete(user: User) {
        return await this.userRepository.remove(user);
    }

} 