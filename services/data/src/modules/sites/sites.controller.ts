import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Controller('sites')
@UseGuards(AuthGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  // ---------- Site Types ----------
  @Get('types')
  async findAllSiteTypes() {
    return this.sitesService.findAllSiteTypes();
  }

  @Post('types')
  @UseGuards(EditorGuard)
  async saveSiteType(@Body() body: { name: string; description: string }) {
    return this.sitesService.saveSiteType(body);
  }

  @Delete('types/:id')
  @UseGuards(EditorGuard)
  async removeSiteType(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.removeSiteType(id);
  }

  // ---------- Sites ----------
  @Get()
  async findAllSites() {
    return this.sitesService.findAllSites();
  }

  @Post()
  @UseGuards(EditorGuard)
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
  @UseGuards(EditorGuard)
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
  @UseGuards(EditorGuard)
  async removeSite(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.removeSite(id);
  }
}
