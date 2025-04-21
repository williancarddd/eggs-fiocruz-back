import { Injectable, NotFoundException } from '@nestjs/common';
import { createPaginator } from 'prisma-pagination';
import { Prisma } from '@prisma/client';
import { encryptPassword } from 'src/utils/crypto';
import { UpdateUserDto, UpdateUserSchema } from './dto/update-user.dto';

import { CreateUserDto, CreateUserSchema } from './dto/create-owner.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import {
  CheckIfAlreadExistsDto,
  CheckIfAlreadExistsSchema,
} from 'src/auth/dto/check-if-already-exists.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.UserWhereUniqueInput, include?: any) {
    const user = await this.prisma.user.findFirst({
      where: { ...where },
      include: {
        loginHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        ...include,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User not found with criteria: ${JSON.stringify(where)}`,
      );
    }
    return user;
  }

  async findAll(query: any) {
    const paginate = createPaginator({
      page: query.limit,
      perPage: query.page,
    });

    return paginate<ResponseUserDto, Prisma.UserFindManyArgs>(
      this.prisma.user,
      {
        where: {
          name: { contains: query.name, mode: 'insensitive' },
          email: { contains: query.email, mode: 'insensitive' },
        },
      },
    );
  }

  async checkIfEmailOrPhoneExists(body: CheckIfAlreadExistsDto) {
    const parsed = CheckIfAlreadExistsSchema.parse(body);
    const { email, phone } = parsed;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [email ? { email } : {}, phone ? { phone } : {}],
      },
    });

    return {
      emailExists: email ? user?.email === email : false,
      phoneExists: phone ? user?.phone === phone : false,
    };
  }

  async create(data: CreateUserDto) {
    const parsed = CreateUserSchema.parse(data);

    const user = await this.prisma.user.create({
      data: {
        ...parsed,
      },
    });

    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne({ id });

    const { ...userData } = UpdateUserSchema.parse(data);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
      },
    });
  }

  async remove(id: string) {
    await this.findOne({ id });
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User successfuly removed' };
  }

  async changePassword({
    userId,
    password,
  }: {
    userId: string;
    password: string;
  }) {
    const hashedPassword = encryptPassword(password);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async updateRecoveryPasswordToken({
    userId,
    token,
    recoveryPasswordTokenExpiresAt,
  }: {
    userId: string;
    token: string | null;
    recoveryPasswordTokenExpiresAt: Date | null;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { recoveryPasswordToken: token, recoveryPasswordTokenExpiresAt },
    });
  }
}
