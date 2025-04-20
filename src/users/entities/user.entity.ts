import { z } from 'zod';
import { Role } from '@prisma/client';
import { DefaultEntitySchema } from 'src/common/default.entity';

export const UserEntitySchema = DefaultEntitySchema.extend({
  email: z.string().email().describe('User email address'),
  avatar: z
    .string()
    .url()
    .optional()
    .nullable()
    .describe('User avatar URL (optional)'),
  name: z.string().describe('User full name (optional)'),
  phone: z
    .string()
    .optional()
    .nullable()
    .describe('User phone number (optional)'),
  role: z.nativeEnum(Role).describe('User role'),
});

export type UserEntity = z.infer<typeof UserEntitySchema>;
