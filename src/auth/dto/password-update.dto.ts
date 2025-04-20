import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PasswordUpdateSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
  token: z.string().min(6),
});

export class PasswordUpdateDto extends createZodDto(PasswordUpdateSchema) {}
