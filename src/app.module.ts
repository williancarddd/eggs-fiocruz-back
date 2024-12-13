import { MiddlewareConsumer, Module } from '@nestjs/common';
import { PrismaModule } from './common/databases/prisma.module';
import { UsersModule } from './users/users.module';
import { ProcessModule } from './process/process.module';
import { EggsCountModule } from './eggs-count/eggs-count.module';
import { AuthModule } from './auths/auths.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auths/guards/jwt-auth.guards';
import { JwtService } from '@nestjs/jwt';
@Module({
  imports: [PrismaModule,
    AuthModule,
    UsersModule,
    ProcessModule,
    EggsCountModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    JwtService
  ],
})
export class AppModule { }
