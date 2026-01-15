import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { VariableService } from './variable.service';

@Controller('variables')
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Post()
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
  async saveUnits(
    @Body() body: { name: string; symbol: string; description: string },
  ) {
    return this.variableService.saveUnit(body);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.variableService.remove(id);
  }
}
