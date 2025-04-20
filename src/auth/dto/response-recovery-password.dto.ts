import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ResponsePasswordRecoverySchema = z.object({
  message: z.string().default('Email with recovery code sent successfully'),
});

export class ResponsePasswordRecoveryDto extends createZodDto(
  ResponsePasswordRecoverySchema,
) {}
