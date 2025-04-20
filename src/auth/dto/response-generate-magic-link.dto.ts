import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ResponseGenerateMagicLinkSchema = z.object({
  message: z.string().default('Token sent successfully'),
});

export class ResponseGenerateMagicLinkDto extends createZodDto(
  ResponseGenerateMagicLinkSchema,
) {}
