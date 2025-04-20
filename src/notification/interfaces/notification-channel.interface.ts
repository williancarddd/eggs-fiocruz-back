import { CreateNotificationDto } from '../dto/create-notification.dto';

export interface NotificationChannel {
  send(notification: CreateNotificationDto): Promise<void>;
}
