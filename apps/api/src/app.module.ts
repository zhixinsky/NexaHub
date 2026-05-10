import { Module } from '@nestjs/common';
import { ActivitiesModule } from './activities/activities.module';
import { HealthController } from './health.controller';
import { ContentsModule } from './contents/contents.module';
import { PagesModule } from './pages/pages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './modules/upload/upload.module';
import { AttachmentApiModule } from './modules/attachmentapi/attachmentapi.module';

@Module({
  imports: [PrismaModule, ContentsModule, ActivitiesModule, ProductsModule, PagesModule, UploadModule, AttachmentApiModule],
  controllers: [HealthController]
})
export class AppModule {}
