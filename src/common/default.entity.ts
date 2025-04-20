import { z } from 'zod';

export const DefaultEntitySchema = z.object({
  id: z.string().describe('Unique identifier'),
  createdAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .optional(),
  updatedAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .optional(),
});
