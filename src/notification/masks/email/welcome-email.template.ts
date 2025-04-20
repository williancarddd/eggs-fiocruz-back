import { z } from 'zod';

export const WelcomeEmailTemplateSchema = z.object({
  id: z.literal('welcome-email'),
  variables: z.object({
    userName: z.string(),
  }),
});

export type WelcomeEmailTemplate = z.infer<typeof WelcomeEmailTemplateSchema>;

export function sourceWelcomeEmail() {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1>{{username}}, WELCOME TO CRM APP</h1>
      <p>Congratulations!</p>
      <p>Here's how to get started:</p>
      <ul>
        <li>Create your first office or include in a team.</li>
        <li>Make some integrations with WhatsApp, Facebook, Instagram, SMS, and more.</li>
        <li>Add your first contact.</li>
        <li>Create your first appointment.</li>]
        <li>Contact your administrator if you need help.</li>
        <li>And More.</li>
      </ul>
      <p>Go to your dashboard</p>
      <p>Best regards,</p>
      <p>CRM APP Team.</p>
    </body>
  </html>
  `;
}
