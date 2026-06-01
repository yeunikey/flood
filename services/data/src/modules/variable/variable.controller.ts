import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { VariableService } from './variable.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { EditorGuard } from 'src/shared/guards/editor.guard';

@Controller('variables')
@UseGuards(AuthGuard)
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Post()
  @UseGuards(EditorGuard)
  async createOrUseVariable(
    @Body()
    body: {
      name: string;
      description?: string;
      unitId?: number;
      unit?: {
        name: string;
        symbol: string;
        description?: string;
      };
    },
  ) {
    return this.variableService.createOrUseVariable(body);
  }

  @Get()
  async findAll() {
    return this.variableService.findAll();
  }

  @Get('/units')
  async findAllUnits() {
    return this.variableService.findAllUnits();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variableService.findOne(id);
  }

  @Post('/variables/units')
  @UseGuards(EditorGuard)
  async saveUnits(
    @Body() body: { name: string; symbol: string; description: string },
  ) {
    return this.variableService.saveUnit(body);
  }

  @Delete(':id')
  @UseGuards(EditorGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.variableService.remove(id);
  }
}
