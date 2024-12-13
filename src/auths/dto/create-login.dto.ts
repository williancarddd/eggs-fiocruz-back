import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthLoginDto extends createZodDto(AuthLoginSchema) { }

export const AuthResponseSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  type: z.nativeEnum(Role),
  sub: z.string(),
  accessToken: z.string(),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) { }