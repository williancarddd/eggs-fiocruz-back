import { Module } from '@nestjs/common';
import { PaletteController } from './palette.controller';
import { PaletteService } from './palette.service';
import { StorageModule } from 'src/common/databases/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [PaletteController],
  providers: [PaletteService],
  exports: [],
})
export class PaletteModule {}
