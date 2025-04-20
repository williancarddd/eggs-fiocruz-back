import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ResponseVerifyMagicLinkSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
});

export class ResponseVerifyMagicLinkDto extends createZodDto(
  ResponseVerifyMagicLinkSchema,
) {}
