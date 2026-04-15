import { Module } from '@nestjs/common';
import { PaletteController } from './palette.controller';
import { PaletteService } from './palette.service';
import { StorageModule } from 'src/common/databases/storage/storage.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    StorageModule,
    BullModule.registerQueue({
      name: 'image-processing',
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT! || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [PaletteController],
  providers: [PaletteService],
  exports: [],
})
export class PaletteModule {}
