import { z } from 'zod';

export class PaginatedOutputDto<T> {
  data: T[] | undefined;
  meta:
    | {
        total: number;
        lastPage: number;
        currentPage: number;
        perPage: number;
        prev: number | null;
        next: number | null;
      }
    | undefined;
}

export const PaginatedOutputSchema = z.object({
  meta: z.object({
    total: z.number(),
    lastPage: z.number(),
    currentPage: z.number(),
    perPage: z.number(),
    prev: z.number().nullable(),
    next: z.number().nullable(),
  }),
});
