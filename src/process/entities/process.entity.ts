import { z } from 'zod';
import { DefaultEntitySchema } from 'src/common/default.entity';
import { UserEntitySchema } from 'src/users/entities/user.entity';

export const ProcessEntitySchema = DefaultEntitySchema.extend({
  description: z.string().optional(),
  userId: z.string().uuid(),
  user: UserEntitySchema.partial(),
});

export type ProcessEntity = z.infer<typeof ProcessEntitySchema>;
