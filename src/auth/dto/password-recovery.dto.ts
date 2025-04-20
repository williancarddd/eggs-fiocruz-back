import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PasswordRecoverySchema = z.object({
  email: z.string().email(),
});

export class PasswordRecoveryDto extends createZodDto(PasswordRecoverySchema) {}
