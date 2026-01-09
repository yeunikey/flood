import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  toSafeUser(user: User) {
    return {
      ...user,
      password: undefined,
    };
  }

  async findByIdSafe(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async findByLoginSafe(login: string) {
    return this.userRepository.findOneBy({ login });
  }

  async getPublicUserById(id: number) {
    const user = await this.findByIdSafe(id);

    if (!user) {
      return {
        statusCode: 400,
        message: 'Пользователь не найден',
      };
    }

    return {
      statusCode: 200,
      data: this.toSafeUser(user),
    };
  }

  async updateProfile(id: number, dto: UserUpdateDto) {
    const user = await this.findByIdSafe(id);

    if (!user) {
      return {
        statusCode: 400,
        message: 'Пользователь не найден',
      };
    }

    if (dto.image !== undefined) {
      user.image = dto.image;
    }

    const saved = await this.userRepository.save(user);

    return {
      statusCode: 200,
      message: 'Профиль обновлён',
      data: this.toSafeUser(saved),
    };
  }

  async deleteById(id: number) {
    const user = await this.findByIdSafe(id);

    if (!user) {
      return {
        statusCode: 400,
        message: 'Пользователь не найден',
      };
    }

    await this.userRepository.remove(user);

    return {
      statusCode: 200,
    };
  }

  async saveUser(user: Partial<User>) {
    return await this.userRepository.save(user);
  }
}
