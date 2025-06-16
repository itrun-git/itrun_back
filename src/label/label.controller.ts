import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { LabelService } from './label.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('label')
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Post()
  @ApiOperation({ summary: 'Create label' })
  create(@Body() dto: CreateLabelDto) {
    return this.labelService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all labels' })
  findAll() {
    return this.labelService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get label by id' })
  findOne(@Param('id') id: string) {
    return this.labelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update label by id' })
  update(@Param('id') id: string, @Body() dto: UpdateLabelDto) {
    return this.labelService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete label by id' })
  remove(@Param('id') id: string) {
    return this.labelService.remove(id);
  }
}
