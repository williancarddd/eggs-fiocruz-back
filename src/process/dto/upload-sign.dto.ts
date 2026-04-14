import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UploadSignSchema = z.object({
  processId: z.string().uuid(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

export class UploadSignDto extends createZodDto(UploadSignSchema) {}

export const UploadSignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  objectKey: z.string(),
  publicUrl: z.string().url(),
  contentType: z.string(),
});

export class UploadSignResponseDto extends createZodDto(
  UploadSignResponseSchema,
) {}
