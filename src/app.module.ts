import { Module } from '@nestjs/common';
import { PrismaModule } from './common/databases/prisma.module';
import { NotificationsModule } from './notification/notifications.module';
import { UserModule } from './users/users.module';

@Module({
  imports: [PrismaModule, NotificationsModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
