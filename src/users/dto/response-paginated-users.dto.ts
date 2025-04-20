import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ResponseUserSchema } from './response-user.dto';
import { PaginatedOutputSchema } from 'src/common/paginated-output.dto';

export const ResponsePaginatedUsersSchema = PaginatedOutputSchema.extend({
  data: z.array(ResponseUserSchema),
});

export class ResponsePaginatedUsersDto extends createZodDto(
  ResponsePaginatedUsersSchema,
) {}
