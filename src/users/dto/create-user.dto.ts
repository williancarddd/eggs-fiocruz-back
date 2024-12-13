import { createZodDto } from "nestjs-zod";
import { UserSchema } from "../entities/user.entity";
import { encryptPassword } from "src/utils/crypto";


export const createUserSchema = UserSchema
  .pick({
    email: true,
    password: true,
    name: true,
    type: true
  })
  .strict()
  .
  transform((data) => {
    return {
      ...data,
      email: data.email.toLowerCase(),
      password: encryptPassword(data.password)
    }
  })
  ;

export class CreateUserDto extends createZodDto(createUserSchema) { }
