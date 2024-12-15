import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FindAllQuerySchema = z.object({
  page: z
    .coerce
    .number()
    .default(1),

  perPage: z
    .coerce
    .number()
    .default(10)
  ,
  userId: z.string().optional(),
})
  .strict();
export type FindAllQuerySchemaType = z.infer<typeof FindAllQuerySchema>;

export class FindAllQueryDto extends createZodDto(FindAllQuerySchema) { }