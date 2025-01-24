import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { CreateProcessExecutionDto, UpdateProcessExecutionDto } from './dto/process-execution.dto';

@Injectable()
export class ProcessExecutionService {
  constructor(private readonly prisma: PrismaService) { }

  async createExecution(createProcessExecutionDto: CreateProcessExecutionDto) {
    return await this.prisma.processExecutions.create({
      data: createProcessExecutionDto,
    });
  }

  async updateExecution(executionId: string, updateDto: UpdateProcessExecutionDto) {
    return await this.prisma.processExecutions.update({
      where: { id: executionId },
      data: updateDto,
      include: {
        Process: true,
      }
    });
  }

  async getExecution(executionId: string) {
    return await this.prisma.processExecutions.findUnique({
      where: { id: executionId },
      include: {
        Process: true,
      }
    });
  }

  async deleteExecution(executionId: string) {

    const processExecution = await this.prisma.processExecutions.findUnique({
      where: { id: executionId },
    });

    if (!processExecution) {
      throw new NotFoundException('Process execution not found');
    }

    return await this.prisma.processExecutions.delete({ where: { id: executionId } });
  }
}
