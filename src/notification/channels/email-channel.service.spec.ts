process.env.APP_NODE_ENV = 'development'; // Garante que o dummy seja usado
process.env.APP_RESEND_EMAIL_FROM = 'Acme <onboarding@test.com>';

import { EmailChannelService } from './email-channel.service';
import {
  NotificationType,
  CreateNotificationDto,
} from '../dto/create-notification.dto';
import * as Handlebars from 'handlebars';

describe('EmailChannelService', () => {
  let emailChannelService: EmailChannelService;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    // Cria uma nova instância do serviço, que utilizará a implementação dummy
    emailChannelService = new EmailChannelService();

    // Espia o método dummy de envio e ajusta o retorno para incluir a propriedade "error"
    sendSpy = jest
      .spyOn(emailChannelService['resend'].emails, 'send')
      .mockImplementation(async () => {
        return { data: { id: 'test-id' }, error: null };
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send email with direct message when no template is provided', async () => {
    const notification: CreateNotificationDto = {
      type: NotificationType.EMAIL,
      recipientEmail: ['test@example.com'],
      subject: 'Test Subject',
      message: 'Test Message',
    };

    await emailChannelService.send(notification);

    expect(sendSpy).toHaveBeenCalledWith({
      from: process.env.APP_RESEND_EMAIL_FROM,
      to: notification.recipientEmail,
      subject: notification.subject,
      html: 'Test Message',
    });
  });

  it('should send email with rendered template if template is provided', async () => {
    const notification: CreateNotificationDto = {
      type: NotificationType.EMAIL,
      recipientEmail: ['test@example.com'],
      subject: 'Welcome!',
      template: {
        id: 'welcome-email',
        variables: {
          userName: 'John',
        },
      },
    };

    await emailChannelService.send(notification);

    // Obtém o template esperado utilizando o método interno getTemplateSource
    const templateSource =
      emailChannelService['getTemplateSource']('welcome-email');
    const compiledTemplate = Handlebars.compile(templateSource);
    const expectedHtml = compiledTemplate(notification.template?.variables);

    expect(sendSpy).toHaveBeenCalledWith({
      from: process.env.APP_RESEND_EMAIL_FROM,
      to: notification.recipientEmail,
      subject: notification.subject,
      html: expectedHtml,
    });
  });

  it('should log error if resend.emails.send fails', async () => {
    // Configura o mock para rejeitar a chamada simulando um erro
    sendSpy.mockRejectedValue(new Error('Send error'));
    const loggerErrorSpy = jest.spyOn(emailChannelService['logger'], 'error');

    const notification: CreateNotificationDto = {
      type: NotificationType.EMAIL,
      recipientEmail: ['test@example.com'],
      subject: 'Error Test',
      message: 'Test Message',
    };

    await emailChannelService.send(notification);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error sending email notification',
      expect.any(Error),
    );
  });
});
