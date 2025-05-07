import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { ProcessProcessor } from './process.processor';

import { FileUploadService } from './services/file-upload.service';
import { TenantModule } from 'src/tenant/tenant.module';
import { StorageModule } from 'src/common/databases/storage/storage.module';

@Module({
  imports: [
    TenantModule,
    StorageModule,
    BullModule.registerQueue({
      name: 'image-processing',
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT! || 6379,
      },
    }),
  ],
  controllers: [ProcessController],
  providers: [ProcessService, ProcessProcessor, FileUploadService],
  exports: [ProcessService],
})
export class ProcessModule {}
