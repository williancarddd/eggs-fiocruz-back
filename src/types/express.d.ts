import { Role } from '@prisma/client';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      role: Role;
    };
  }
}
