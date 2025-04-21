import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class TenantService {
  companyId?: string;
  userId?: string;
  role: Role | undefined;
}
