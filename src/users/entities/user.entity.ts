import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid().describe('User ID'),
  email: z.string().email().describe('User Email'),
  password: z.string().min(6).describe('User Password'),
  name: z.string().min(3).describe('User Name'),
  type: z.nativeEnum(Role).describe('User Type'),
  createdAt: z.string().datetime().optional().describe('Date of Creation'),
  updatedAt: z.string().datetime().optional().describe('Date of Update')
  //process
  //historyLogin
});


export type UserDtoType = z.infer<typeof UserSchema>;
export class UserDto extends createZodDto(UserSchema) { }