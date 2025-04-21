import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { ProcessProcessor } from './process.processor';
import { SupabaseService } from 'src/common/databases/supabase/supabase.service';
import { PaletteService } from './palette.service';
import { PaletteController } from './palette.controller';
import { FileUploadService } from './services/file-upload.service';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [
    TenantModule,
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  controllers: [ProcessController, PaletteController],
  providers: [
    ProcessService,
    ProcessProcessor,
    PaletteService,
    SupabaseService,
    FileUploadService,
  ],
  exports: [ProcessService, PaletteService],
})
export class ProcessModule {}
