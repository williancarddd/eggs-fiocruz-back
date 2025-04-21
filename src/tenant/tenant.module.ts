import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantGuard } from './tenant.guard';
import { APP_GUARD } from '@nestjs/core';

@Global()
@Module({
  providers: [
    TenantService,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
