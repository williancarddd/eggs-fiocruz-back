import { createZodDto } from 'nestjs-zod';
import { UserEntitySchema } from '../entities/user.entity';

export const UpdateUserSchema = UserEntitySchema.pick({
  email: true,
  name: true,
  phone: true,
  avatar: true,
})
  .partial()
  .strict();

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
