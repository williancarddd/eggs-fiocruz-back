import { createZodDto } from 'nestjs-zod';
import { UserEntitySchema } from '../entities/user.entity';
import { encryptPassword } from 'src/utils/crypto';
import { z } from 'zod';

export const CreateUserSchema = UserEntitySchema.pick({
  email: true,
  name: true,
  phone: true,
})
  .extend({
    password: z
      .string()
      .min(6, { message: 'Password must have at least 6 characters' })
      .describe('User password'),
  })
  .transform((data) => ({
    ...data,
    password: encryptPassword(data.password),
  }));

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
