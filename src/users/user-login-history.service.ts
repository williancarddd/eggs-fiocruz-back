import { Injectable } from '@nestjs/common';
import {
  LoginRegisterUserDto,
  LoginRegisterUserSchema,
} from './dto/login-register-user.dto';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';

@Injectable()
export class UserRegisterLoginHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: LoginRegisterUserDto) {
    const parsed = LoginRegisterUserSchema.parse(data);
    return this.prisma.loginHistory.create({ data: parsed });
  }
}
