import { Module } from '@nestjs/common';
import { ContentsController, PublicContentsController } from './contents.controller';
import { ContentsService } from './contents.service';

@Module({
  controllers: [ContentsController, PublicContentsController],
  providers: [ContentsService]
})
export class ContentsModule {}
