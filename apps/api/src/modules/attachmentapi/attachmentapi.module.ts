import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttachmentApiController } from './attachmentapi.controller';
import { AttachmentApiService } from './attachmentapi.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttachmentApiController],
  providers: [AttachmentApiService]
})
export class AttachmentApiModule {}

