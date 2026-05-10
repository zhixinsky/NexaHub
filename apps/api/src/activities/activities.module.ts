import { Module } from '@nestjs/common';
import { ActivitiesController, PublicActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesController, PublicActivitiesController],
  providers: [ActivitiesService]
})
export class ActivitiesModule {}
