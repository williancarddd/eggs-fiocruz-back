import { Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationChannelFactory } from './factories/notification-channel.factory';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly channelFactory: NotificationChannelFactory) {}

  private async sendNotification(notification: CreateNotificationDto) {
    const channel = this.channelFactory.getChannel(notification.type);
    await channel.send(notification);
  }

  @OnEvent('notification.created')
  async handleNotificationEvent(notification: CreateNotificationDto) {
    this.logger.verbose(`Received notification event for ${notification.type}`);
    await this.sendNotification(notification);
  }
}
