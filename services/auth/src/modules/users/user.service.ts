import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  toSafeUser(user: User | null) {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async findByIdSafe(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async findByLoginSafe(login: string) {
    return this.userRepository.findOneBy({ login });
  }

  async getAllUsers() {
    const users = await this.userRepository.find({ order: { id: 'ASC' } });
    return users.map((u) => this.toSafeUser(u));
  }

  async createUser(dto: CreateUserDto) {
    if (dto.role === 'admin') {
      throw new BadRequestException('Нельзя создать админа вручную');
    }

    const exists = await this.userRepository.findOneBy({ login: dto.login });
    if (exists) {
      throw new BadRequestException('Логин занят');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return this.toSafeUser(await this.userRepository.save(user));
  }

  async updateRole(id: number, role: UserRole) {
    if (role === 'admin') {
      throw new BadRequestException('Нельзя назначить роль админа');
    }
    await this.userRepository.update(id, { role });
    return this.toSafeUser(await this.findByIdSafe(id));
  }

  async deleteById(id: number) {
    await this.userRepository.delete(id);
    return { statusCode: 200 };
  }

  async updateProfile(id: number, dto: UserUpdateDto) {
    await this.userRepository.update(id, dto);
    return this.toSafeUser(await this.findByIdSafe(id));
  }
}
