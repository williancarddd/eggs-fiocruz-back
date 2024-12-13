import { User } from '@prisma/client';
import { Request } from 'express';

export interface AuthUser extends User {
  sub: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}