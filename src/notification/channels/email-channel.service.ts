import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { sourceWelcomeEmail } from '../masks/email/welcome-email.template';
import * as Handlebars from 'handlebars';
import { sourcePasswordReset } from '../masks/email/password-reset.template';
import { sourceMagicLogin } from '../masks/email/magic-login.template';
import { sourceInvitation } from '../masks/email/invitation.template';

@Injectable()
export class EmailChannelService implements NotificationChannel {
  private readonly logger = new Logger(EmailChannelService.name);
  private readonly resend: Resend;

  constructor() {
    if (process.env.APP_NODE_ENV === 'development') {
      // Implementação dummy para ambiente de testes
      this.resend = {
        emails: {
          send: async (payload: any) => {
            this.logger.log(
              `Simulated sending email with payload: ${JSON.stringify(payload)}`,
            );
            return { data: { id: 'test-id' } };
          },
        },
      } as unknown as Resend;
    } else {
      this.resend = new Resend(process.env.APP_RESEND_API_KEY);
    }
  }

  async send(notification: CreateNotificationDto) {
    try {
      let htmlContent = notification.message || '';
      if (notification.template) {
        const templateSource = this.getTemplateSource(notification.template.id);
        const templateCompiler = Handlebars.compile(templateSource);
        htmlContent = templateCompiler(notification.template.variables);
      }

      await this.resend.emails.send({
        from: process.env.APP_RESEND_EMAIL_FROM!,
        to: notification.recipientEmail!,
        subject: notification.subject,
        html: htmlContent,
      });
    } catch (error) {
      this.logger.error('Error sending email notification', error);
    }
  }

  private getTemplateSource(templateId: string): string {
    switch (templateId) {
      case 'welcome-email':
        return sourceWelcomeEmail();
      case 'password-reset':
        return sourcePasswordReset();
      case 'magic-login':
        return sourceMagicLogin();
      case 'invitation':
        return sourceInvitation();
      default:
        return `<p>{{message}}</p>`;
    }
  }
}
