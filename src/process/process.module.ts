import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { SupabaseService } from 'src/common/databases/supabase/supabase.service';
import { ProcessExecutionService } from './process-execution.service';

@Module({
  imports: [],
  controllers: [ProcessController],
  providers: [ProcessService, SupabaseService, ProcessExecutionService],
})
export class ProcessModule { }
