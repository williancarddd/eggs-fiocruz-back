import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginatedOutputSchema } from 'src/common/paginated-output.dto';
import { ResponseProcessSchema } from './response-process.dto';

export const ResponsePaginatedProcessSchema = PaginatedOutputSchema.extend({
  data: z.array(ResponseProcessSchema),
});

export class ResponsePaginatedProcessDto extends createZodDto(
  ResponsePaginatedProcessSchema,
) {}
