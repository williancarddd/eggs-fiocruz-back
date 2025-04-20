import { z } from 'zod';

export const InvitationTemplateSchema = z.object({
  id: z.literal('invitation'),
  variables: z.object({
    email: z.string(),
    callbackUrl: z.string(),
  }),
});

export type InvitationTemplate = z.infer<typeof InvitationTemplateSchema>;

export function sourceInvitation() {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1>You're Invited!</h1>
      <p>Hello {{email}},</p>
      <p>You have been invited by CRM. Please click the link below to accept the invitation:</p>
      <p><a href="{{callbackUrl}}">{{callbackUrl}}</a></p>
      <p>If you did not expect this invitation, please ignore this email.</p>
      <p>Best regards,</p>
      <p>CRM App Team</p>
    </body>
  </html>
  `;
}
