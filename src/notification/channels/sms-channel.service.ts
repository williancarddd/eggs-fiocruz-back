import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class SmsChannelService implements NotificationChannel {
  async send(notification: CreateNotificationDto): Promise<void> {
    // Lógica para envio de SMS
    console.log('Enviando SMS:', notification);
    // Exemplo: await smsProvider.send({ ... });
  }
}
