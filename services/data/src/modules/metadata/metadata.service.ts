import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Qcl } from './entities/qcl.entity';
import { DataSource } from './entities/data_source.entity';
import { MethodType } from './entities/method_type.entity';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(DataSource)
    private sourceRepo: Repository<DataSource>,

    @InjectRepository(MethodType)
    private methodRepo: Repository<MethodType>,

    @InjectRepository(Qcl)
    private qclRepo: Repository<Qcl>,
  ) {}

  // ---------- DataSource ----------
  async findAllSources() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.sourceRepo.find(),
    };
  }

  async saveSource(data: { name: string }) {
    const source = await this.sourceRepo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: source,
    };
  }

  async removeSource(id: number) {
    const source = await this.sourceRepo.findOneBy({ id });
    if (!source) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Источник #${id} не найден`,
      };
    }
    await this.sourceRepo.remove(source);
    return {
      statusCode: HttpStatus.OK,
    };
  }

  // ---------- MethodType ----------
  async findAllMethods() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.methodRepo.find(),
    };
  }

  async saveMethod(data: { name: string; description?: string }) {
    const method = await this.methodRepo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: method,
    };
  }

  async removeMethod(id: number) {
    const method = await this.methodRepo.findOneBy({ id });
    if (!method) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Метод #${id} не найден`,
      };
    }
    await this.methodRepo.remove(method);
    return {
      statusCode: HttpStatus.OK,
    };
  }

  // ---------- QCL ----------
  async findAllQcls() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.qclRepo.find(),
    };
  }

  async saveQcl(data: { name?: string; description?: string }) {
    const qcl = await this.qclRepo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: qcl,
    };
  }

  async removeQcl(id: number) {
    const qcl = await this.qclRepo.findOneBy({ id });
    if (!qcl) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `QCL #${id} не найден`,
      };
    }
    await this.qclRepo.remove(qcl);
    return {
      statusCode: HttpStatus.OK,
    };
  }
}
