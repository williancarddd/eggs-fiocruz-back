import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './common/databases/prisma.module';
import { NotificationsModule } from './notification/notifications.module';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LoggerHttpMiddleware } from './common/middleware/logging-http.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenantModule } from './tenant/tenant.module';
import { ProcessModule } from './process/process.module';
import { PaletteModule } from './palletes/pallete.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot({
      delimiter: '.',
      newListener: true,
      removeListener: true,
      wildcard: true,
      maxListeners: 10,
    }),
    TenantModule,
    NotificationsModule,
    AuthModule,
    UserModule,
    ProcessModule,
    PaletteModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerHttpMiddleware).forRoutes('*');
  }
}
