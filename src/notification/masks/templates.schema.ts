import { z } from 'zod';
import { WelcomeEmailTemplateSchema } from './email/welcome-email.template';
import { PasswordResetTemplateSchema } from './email/password-reset.template';
import { MagicLoginSchema } from './email/magic-login.template';
import { InvitationTemplateSchema } from './email/invitation.template';

export const TemplateSchema = z.union([
  WelcomeEmailTemplateSchema,
  PasswordResetTemplateSchema,
  MagicLoginSchema,
  InvitationTemplateSchema,
]);

export type Template = z.infer<typeof TemplateSchema>;
