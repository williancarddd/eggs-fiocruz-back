import { Injectable } from '@nestjs/common';
import { CreateUserDto, createUserSchema } from './dto/create-user.dto';
import { UpdateUserDto, updateUserSchema } from './dto/update-user.dto';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { createPaginator } from 'prisma-pagination';
import { UserDto } from './entities/user.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }
  async create(createUserDto: CreateUserDto) {
    const userParsed = createUserSchema.parse(createUserDto);

    return await this.prisma.user.create({
      data: userParsed,
      omit: {
        password: true
      }
    });

  }

  async findAll() {
    const paginator = createPaginator({
      page: 1,
      perPage: 100,
    })

    return await paginator<UserDto, Prisma.UserFindManyArgs>(
      this.prisma.user,
      {
        include: {
          loginHistory: true,
          processes: true
        },
        omit: {
          password: true
        }
      })
  }

  async findOne(id: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      omit: {
        password: true
      },
      include: {
        loginHistory: true,
        processes: true
      }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updateParsed = updateUserSchema.parse(updateUserDto);

    await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
    });

    return await this.prisma.user.update({
      where: {
        id,
      },
      omit: {
        password: true
      },
      data: updateParsed,
    });
  }

  async remove(id: string) {

    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
    });

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return user;
  }

  async registerHistoryLogin(id: string, date: Date) {
    return await this.prisma.loginHistory.create({
      data: {
        userId: id,
        loginAt: date,
      },
    });
  }

  async findByEmail(email: string) {
    /**
     * USED IN AUTHS SERVICE FOR GET USER BY EMAIL
     */
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
}
