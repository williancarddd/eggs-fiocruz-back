import { createZodDto } from 'nestjs-zod';
import { UserEntitySchema } from '../entities/user.entity';
import { z } from 'zod';

export const ResponseUserSchema = UserEntitySchema.extend({
  loginHistory: z
    .array(
      z.object({
        id: z.string(),
        userAgent: z.string(),
        strategy: z.string(),
      }),
    )
    .optional(),
}).partial();

export class ResponseUserDto extends createZodDto(ResponseUserSchema) {}
