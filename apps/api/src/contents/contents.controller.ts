import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { ListQuery } from '../common/crud-query';
import { ContentsService } from './contents.service';

@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  findAll(@Query() query: ListQuery) {
    return this.contentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentsService.findOne(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.contentsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contentsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentsService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.contentsService.updateStatus(id, status);
  }
}
