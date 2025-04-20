import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class PusherChannelService implements NotificationChannel {
  async send(notification: CreateNotificationDto): Promise<void> {
    // Lógica para envio via Pusher
    console.log('Enviando notificação via Pusher:', notification);
    // Exemplo: await pusher.trigger(...);
  }
}
