import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TemplateSchema } from '../masks/templates.schema';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSHER = 'pusher',
}

export const NotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  recipientEmail: z.string().email().array().optional(),
  recipientPhone: z.string().optional(),
  recipientId: z.string().optional(),
  subject: z.string(),
  message: z.string().optional(),
  template: TemplateSchema.optional(),
});

export class CreateNotificationDto extends createZodDto(NotificationSchema) {}
