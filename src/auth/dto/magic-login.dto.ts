import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MagicLoginSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().url(),
});

export class MagicLoginDto extends createZodDto(MagicLoginSchema) {}
