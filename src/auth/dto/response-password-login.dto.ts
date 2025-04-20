import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
});

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
