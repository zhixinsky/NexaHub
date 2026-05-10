import { Controller, Get, Param } from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('public/pages')
export class PublicPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':code')
  findPublishedByCode(@Param('code') code: string) {
    return this.pagesService.findPublishedByCode(code);
  }
}
