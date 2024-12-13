import { createZodDto } from "nestjs-zod";
import { UserSchema } from "../entities/user.entity";


export const updateUserSchema = UserSchema
  .pick({
    email: true,
    name: true,
  })
  .partial()
  .strict();

export class UpdateUserDto extends createZodDto(updateUserSchema) { }
