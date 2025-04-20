import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PasswordService } from './password/password.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './password/local.strategy';
import { UserModule } from '../users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { MagicLoginStrategy } from './magic/magic.strategy';
import { MagicLoginService } from './magic/magic.service';
import { ENV } from 'src/common/constants/constants';
import { UserRegisterLoginHistoryService } from 'src/users/user-login-history.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    PasswordService,
    LocalStrategy,
    JwtStrategy,
    JwtModule,
    MagicLoginStrategy,
    MagicLoginService,
    UserRegisterLoginHistoryService,
  ],
})
export class AuthModule {}
