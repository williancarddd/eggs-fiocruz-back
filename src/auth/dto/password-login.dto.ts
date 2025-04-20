import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PasswordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class PasswordLoginDto extends createZodDto(PasswordLoginSchema) {}
