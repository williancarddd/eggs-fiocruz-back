import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/zip',
];
const MAX_IMAGES = 100;

export const CreateProcessSchema = z.object({
  description: z.string().optional(),
  files: z
    .array(
      z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z
          .string()
          .refine((type) => ACCEPTED_IMAGE_TYPES.includes(type), {
            message:
              'File type not supported. Only .jpg, .jpeg, .png and .zip files are allowed',
          }),
        size: z
          .number()
          .max(MAX_FILE_SIZE, 'File size must be less than 200MB'),
        buffer: z.instanceof(Buffer),
      }),
    )
    .max(MAX_IMAGES, `Maximum of ${MAX_IMAGES} files allowed`)

    .optional(),
});

export class CreateProcessDto extends createZodDto(CreateProcessSchema) {}
