import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ResponsePasswordUpdateSchema = z.object({
  message: z.string().default('Password updated successfully'),
});

export class ResponsePasswordUpdateDto extends createZodDto(
  ResponsePasswordUpdateSchema,
) {}
