import { z } from 'zod';

export const MagicLoginSchema = z.object({
  id: z.literal('magic-login'),
  variables: z.object({
    url: z.string(),
  }),
});

export type MagicLoginTemplate = z.infer<typeof MagicLoginSchema>;

export function sourceMagicLogin() {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1>Magic Login</h1>
      <p>To login, click the following link: <a href="{{url}}">Login</a></p>
      <p>Best regards,</p>
      <p>CRM App Team</p>
    </body>
  `;
}
