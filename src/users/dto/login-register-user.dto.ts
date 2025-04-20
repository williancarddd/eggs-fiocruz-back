import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginRegisterUserSchema = z.object({
  userId: z.string().describe('The user id'),
  ipAddress: z.string().describe('The ip address').default('unknown'),
  userAgent: z.string().describe('The user agent').default('unknown'),
  url: z.string().describe('The url').default('unknown'),
  strategy: z.string().describe('The strategy'),
});

export class LoginRegisterUserDto extends createZodDto(
  LoginRegisterUserSchema,
) {}
