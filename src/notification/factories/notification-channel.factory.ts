import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '../dto/create-notification.dto';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { EmailChannelService } from '../channels/email-channel.service';
import { SmsChannelService } from '../channels/sms-channel.service';
import { PusherChannelService } from '../channels/pusher-channel.service';

@Injectable()
export class NotificationChannelFactory {
  constructor(
    private readonly emailChannel: EmailChannelService,
    private readonly smsChannel: SmsChannelService,
    private readonly pusherChannel: PusherChannelService,
  ) {}

  getChannel(type: NotificationType): NotificationChannel {
    switch (type) {
      case NotificationType.EMAIL:
        return this.emailChannel;
      case NotificationType.SMS:
        return this.smsChannel;
      case NotificationType.PUSHER:
        return this.pusherChannel;
      default:
        throw new NotFoundException(`Channel ${type} not found`);
    }
  }
}
