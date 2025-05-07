import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ResponsePaletteSchema } from './response-palette.dto';
import { PaginatedOutputSchema } from 'src/common/paginated-output.dto';

export const ResponsePaginatedPaletteSchema = PaginatedOutputSchema.extend({
  data: z.array(ResponsePaletteSchema),
});

export class ResponsePaginatedPaletteDto extends createZodDto(
  ResponsePaginatedPaletteSchema,
) {}
