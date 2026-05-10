import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { ListQuery } from '../common/crud-query';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll(@Query() query: ListQuery) {
    return this.activitiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.activitiesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.activitiesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.activitiesService.updateStatus(id, status);
  }
}

@Controller('public/activities')
export class PublicActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll(@Query() query: ListQuery) {
    return this.activitiesService.findAll({ ...query, status: query.status || 'published' });
  }
}
