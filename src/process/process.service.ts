import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { createPaginator } from 'prisma-pagination';
import { Prisma } from '@prisma/client';
import { FindAllQueryDto, FindAllQuerySchema } from './dto/findall-query.dto';
import { ProcessDto } from './entities/process.entity';

@Injectable()
export class ProcessService {
  constructor(private readonly prisma: PrismaService) { }

  async createProcess(createProcessDto: CreateProcessDto) {
    const { processExecution, ...processData } = createProcessDto;

    const process = await this.prisma.process.create({
      data: {
        ...processData,
        results: {
          create: { ...processExecution, status: 'IN_PROGRESS' },
        },
      },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
    });

    return process;
  }

  async updateProcess(processId: string, updateProcessDto: UpdateProcessDto) {
    return await this.prisma.process.update({
      where: { id: processId },
      data: updateProcessDto,
    });
  }

  async findAll(query: FindAllQueryDto) {
    const { page, perPage, userId } = FindAllQuerySchema.parse(query);
    const paginator = createPaginator({
      page,
      perPage
    });

    return await paginator<ProcessDto[], Prisma.ProcessFindManyArgs>(
      this.prisma.process
      ,
      {
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
          }
        },
      });
  }

  async findOne(processId: string, take?: number) {
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          take,
        }
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return process;
  }

  async deleteProcess(processId: string) {
    const process = await this.prisma.process.findUnique({ where: { id: processId } });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return await this.prisma.process.delete({ where: { id: processId } });
  }
}
