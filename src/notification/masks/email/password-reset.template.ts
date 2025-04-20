import { z } from 'zod';

export const PasswordResetTemplateSchema = z.object({
  id: z.literal('password-reset'),
  variables: z.object({
    resetToken: z.string(),
  }),
});

export type PasswordResetTemplate = z.infer<typeof PasswordResetTemplateSchema>;

export function sourcePasswordReset() {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1>Password Reset Code</h1>
      <p>Your password reset code is: <strong>{{resetToken}}</strong></p>
      <p>Best regards,</p>
      <p>CRM App Team</p>
    </body>
  </html>
  `;
}
