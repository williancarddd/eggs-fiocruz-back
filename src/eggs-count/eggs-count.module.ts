import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EggsCountService } from './eggs-count.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
    }),
  ],
  providers: [EggsCountService],
  exports: [EggsCountService],
})
export class EggsCountModule { }
