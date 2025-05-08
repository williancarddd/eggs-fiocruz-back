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
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1>Redefinição de Senha - Plataforma Mosquito Count</h1>
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir sua senha na nossa plataforma de monitoramento de ovos de mosquito.</p>
      <p>Use o seguinte código para redefinir sua senha com segurança:</p>
      <p style="font-size: 1.5em; font-weight: bold; color: #2c3e50;">{{resetToken}}</p>
      <p>Se você não solicitou esta alteração, por favor ignore este e-mail.</p>
      <p>Atenciosamente,</p>
      <p>Equipe Mosquito Count</p>
    </body>
  </html>
  `;
}
