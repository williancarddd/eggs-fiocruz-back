import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailChannelService } from './channels/email-channel.service';
import { SmsChannelService } from './channels/sms-channel.service';
import { PusherChannelService } from './channels/pusher-channel.service';
import { NotificationChannelFactory } from './factories/notification-channel.factory';

@Global()
@Module({
  providers: [
    NotificationsService,
    EmailChannelService,
    SmsChannelService,
    PusherChannelService,
    NotificationChannelFactory,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
