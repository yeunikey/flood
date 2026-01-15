import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Variable } from './entities/variable.entity';

@Injectable()
export class VariableService {
  constructor(
    @InjectRepository(Variable)
    private variableRepo: Repository<Variable>,

    @InjectRepository(Unit)
    private unitRepo: Repository<Unit>,
  ) {}

  async createOrUseVariable(data: {
    name: string;
    description?: string;
    unitId?: number;
    unit?: {
      name: string;
      symbol: string;
      description?: string;
    };
  }) {
    let unit: Unit | null = null;

    if (data.unitId) {
      unit = await this.unitRepo.findOne({ where: { id: data.unitId } });

      if (!unit) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Единица #${data.unitId} не найдена`,
        };
      }
    }

    if (!unit && data.unit) {
      unit = await this.unitRepo.save(data.unit);
    }

    if (!unit) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Не указана единица измерения',
      };
    }

    const variable = await this.variableRepo.save({
      name: data.name,
      description: data.description,
      unit,
    });

    return {
      statusCode: HttpStatus.OK,
      data: variable,
    };
  }

  async findAll() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.variableRepo.find({
        relations: ['unit'],
      }),
    };
  }

  async findAllUnits() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.unitRepo.find(),
    };
  }

  async findOne(id: number) {
    const variable = await this.variableRepo.findOne({
      where: { id },
      relations: ['unit'],
    });

    if (!variable) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Такая переменная #${id} не найдена`,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: variable,
    };
  }

  async save(data: { name: string; description?: string; unitId: number }) {
    const unit = await this.unitRepo.findOne({ where: { id: data.unitId } });

    if (!unit) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Такая единица #${data.unitId} не найдена`,
      };
    }

    const variable = this.variableRepo.save({
      name: data.name,
      description: data.description,
      unit,
    });

    return {
      statusCode: HttpStatus.OK,
      data: variable,
    };
  }

  async saveUnit(data: { name: string; symbol: string; description?: string }) {
    const unit = await this.unitRepo.save({
      name: data.name,
      symbol: data.symbol,
      description: data.description,
    });

    return {
      statusCode: HttpStatus.OK,
      data: unit,
    };
  }

  async remove(id: number) {
    const variable = await this.variableRepo.findOne({
      where: { id },
      relations: ['unit'],
    });

    if (!variable) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Такая переменная #${id} не найдена`,
      };
    }

    await this.variableRepo.remove(variable);

    return {
      statusCode: HttpStatus.OK,
    };
  }
}
