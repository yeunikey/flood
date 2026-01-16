import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site';
import { SiteType } from './entities/site_type';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private siteRepo: Repository<Site>,

    @InjectRepository(SiteType)
    private siteTypeRepo: Repository<SiteType>,
  ) {}

  async findAllSiteTypes() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.siteTypeRepo.find(),
    };
  }

  async saveSiteType(data: { name: string; description: string }) {
    const siteType = await this.siteTypeRepo.save(data);

    return {
      statusCode: HttpStatus.OK,
      data: siteType,
    };
  }

  async removeSiteType(id: number) {
    const siteType = await this.siteTypeRepo.findOneBy({ id });

    if (!siteType) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Тип точки #${id} не найден`,
      };
    }

    await this.siteTypeRepo.remove(siteType);

    return {
      statusCode: HttpStatus.OK,
    };
  }

  async findAllSites() {
    return {
      statusCode: HttpStatus.OK,
      data: await this.siteRepo.find(),
    };
  }

  async saveSite(data: {
    code: string;
    name: string;
    longtitude: number;
    latitude: number;
    siteTypeId: number;
  }) {
    const siteType = await this.siteTypeRepo.findOneBy({ id: data.siteTypeId });
    if (!siteType) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Тип точки #${data.siteTypeId} не найден`,
      };
    }

    const site = await this.siteRepo.save({
      code: data.code,
      name: data.name,
      longtitude: data.longtitude,
      latitude: data.latitude,
      siteType,
    });

    return {
      statusCode: HttpStatus.OK,
      data: site,
    };
  }

  async saveSites(
    data: {
      code: string;
      name: string;
      longtitude: number;
      latitude: number;
      siteTypeId: number;
    }[],
  ) {
    const result: Site[] = [];

    for (const siteData of data) {
      const siteType = await this.siteTypeRepo.findOneBy({
        id: siteData.siteTypeId,
      });
      if (!siteType) {
        continue;
      }

      let site = await this.siteRepo.findOneBy({ code: siteData.code });

      if (site) {
        site.name = siteData.name;
        site.longtitude = siteData.longtitude;
        site.latitude = siteData.latitude;
        site.siteType = siteType;

        site = await this.siteRepo.save(site);
      } else {
        site = await this.siteRepo.save({
          code: siteData.code,
          name: siteData.name,
          longtitude: siteData.longtitude,
          latitude: siteData.latitude,
          siteType,
        });
      }

      result.push(site);
    }

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  async removeSite(id: number) {
    const site = await this.siteRepo.findOneBy({ id });

    if (!site) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Точка #${id} не найдена`,
      };
    }

    await this.siteRepo.remove(site);

    return {
      statusCode: HttpStatus.OK,
    };
  }
}
