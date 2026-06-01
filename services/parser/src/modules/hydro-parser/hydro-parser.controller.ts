import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { HydroParserService } from './hydro-parser.service';
import { ImportHydroSiteDto } from './dto/hydro-parser.dto';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Controller('hydro')
@UseGuards(AuthGuard, EditorGuard)
export class HydroParserController {
  constructor(private readonly hydroParserService: HydroParserService) {}

  @Get('sites')
  getSites(): Promise<any> {
    return this.hydroParserService.getSitesOverview();
  }

  @Get('sites/:siteCode/available')
  getAvailable(@Param('siteCode') siteCode: string): Promise<any> {
    return this.hydroParserService.getRemoteSiteAvailability(siteCode);
  }

  @Post('import-all')
  importAll(): Promise<any> {
    return this.hydroParserService.importAllAvailableSites();
  }

  @Post('sites/:siteCode/import')
  importSite(
    @Param('siteCode') siteCode: string,
    @Body() body: Omit<ImportHydroSiteDto, 'siteCode'>,
  ): Promise<any> {
    return this.hydroParserService.importSite({
      siteCode,
      startDate: body.startDate,
      endDate: body.endDate,
    });
  }
}
