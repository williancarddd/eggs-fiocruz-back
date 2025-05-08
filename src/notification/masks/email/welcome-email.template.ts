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
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1>Bem-vindo(a) à Plataforma Mosquito Count, {{userName}}!</h1>
      <p>Estamos muito felizes em tê-lo(a) conosco na nossa missão de monitoramento e controle do mosquito transmissor.</p>
      <p>Confira alguns dos recursos disponíveis para você começar:</p>
      <ul>
        <li><strong>Contagem automatizada de múltiplos arquivos</strong> para agilizar suas análises.</li>
        <li><strong>Georreferenciamento preciso</strong> das amostras para mapeamento eficaz.</li>
        <li><strong>Alta precisão na contagem</strong> com nossa tecnologia validada.</li>
        <li><strong>Parceria oficial com a Fiocruz</strong>, garantindo confiabilidade científica.</li>
      </ul>
      <p>Pronto para começar? Acesse sua dashboard e explore todas as funcionalidades da plataforma.</p>
      <p>Se precisar de ajuda, nossa equipe de suporte está à disposição.</p>
      <p>Atenciosamente,</p>
      <p>Equipe Mosquito Count</p>
    </body>
  </html>
  `;
}
