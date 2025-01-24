import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';

import { createPaginator } from 'prisma-pagination';
import { Prisma } from '@prisma/client';
import { FindAllQueryDto, FindAllQuerySchema } from './dto/findall-query.dto';
import { CreateProcessDto, ProcessDto, UpdateProcessDto } from './dto/process.dto';


@Injectable()
export class ProcessService {
  constructor(private readonly prisma: PrismaService) { }

  async createProcess(createProcessDto: CreateProcessDto) {
    const { processExecution, ...processData } = createProcessDto;
    const findPRocess = await this.prisma.process.findUnique({ where: { id: createProcessDto.id } });

    /*
    * If the process has an ID, it means that the process already exists and we are adding a new execution to it.
    */

    if (findPRocess) {
      const createProcessExecution = await this.prisma.processExecutions.create({
        data: {
          id: processExecution.id,
          expectedEggs: processExecution.expectedEggs,
          algorithm: processExecution.algorithm,
          processId: findPRocess.id,
          description: processExecution.description,
        },
      });

      return {
        process: findPRocess,
        processExecution: createProcessExecution,
      };
    }


    const createdPRocess = await this.prisma.process.create({
      data: {
        description: processData.description,
        userId: processData.userId,
        processExecutions: {
          create: {
            id: processExecution.id,
            expectedEggs: processExecution.expectedEggs,
            algorithm: processExecution.algorithm,
            description: processExecution.description,
          }
        },
      },
      include: {
        processExecutions: {
          // get the most recent execution
          take: 1,
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    return {
      process: createdPRocess,
      processExecution: createdPRocess.processExecutions[0],
    }

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
          processExecutions: {
            orderBy: { createdAt: 'desc' },
          },
          user: {
            omit: {
              password: true,
            }
          }
        },
      });
  }


  async findOne(processId: string) {

    const process = await this.prisma.process.findUnique({
      where: { id: processId },
      include: {
        processExecutions: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          omit: {
            password: true,
          }
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
