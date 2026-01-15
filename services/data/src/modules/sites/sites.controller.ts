import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  // ---------- Site Types ----------
  @Get('types')
  async findAllSiteTypes() {
    return this.sitesService.findAllSiteTypes();
  }

  @Post('types')
  async saveSiteType(@Body() body: { name: string; description: string }) {
    return this.sitesService.saveSiteType(body);
  }

  @Delete('types/:id')
  async removeSiteType(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.removeSiteType(id);
  }

  // ---------- Sites ----------
  @Get()
  async findAllSites() {
    return this.sitesService.findAllSites();
  }

  @Post()
  async saveSite(
    @Body()
    body: {
      code: string;
      name: string;
      longtitude: number;
      latitude: number;
      siteTypeId: number;
    },
  ) {
    return this.sitesService.saveSite(body);
  }

  @Post('bulk')
  async saveSites(
    @Body()
    body: {
      code: string;
      name: string;
      longtitude: number;
      latitude: number;
      siteTypeId: number;
    }[],
  ) {
    return this.sitesService.saveSites(body);
  }

  @Delete(':id')
  async removeSite(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.removeSite(id);
  }
}
