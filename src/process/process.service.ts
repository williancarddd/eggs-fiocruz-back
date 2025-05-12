import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { TenantService } from 'src/tenant/tenant.service';
import { Prisma } from '@prisma/client';
import { FileUploadService } from './services/file-upload.service';
import { Readable } from 'stream';
import { ResponseProcessDto } from './dto/response-process.dto';
import { createPaginator } from 'prisma-pagination';

@Injectable()
export class ProcessService {
  constructor(
    private readonly prisma: PrismaService,
    private tenantService: TenantService,
    private fileUploadService: FileUploadService,
  ) {}

  async findAll(query: any) {
    const paginate = createPaginator({
      page: query.page,
      perPage: query.limit,
    });

    const where: Prisma.ProcessWhereInput = {
      userId: this.tenantService.userId,
    };

    if (query.description) {
      where.description = {
        contains: query.description,
        mode: 'insensitive',
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};

      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }

      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    return paginate<ResponseProcessDto, Prisma.ProcessFindManyArgs>(
      this.prisma.process,
      {
        where,
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    );
  }

  async create(createProcessDto: CreateProcessDto) {
    const process = await this.prisma.process.create({
      data: {
        userId: this.tenantService.userId!,
        description: createProcessDto.description,
      },
    });

    if (createProcessDto.files?.length) {
      const mappedFiles: Express.Multer.File[] = createProcessDto.files.map(
        (file) => {
          const buffer = Buffer.from(file.buffer);
          return {
            ...file,
            buffer,
            stream: Readable.from(buffer),
            destination: '',
            filename: file.originalname,
            path: '',
          };
        },
      );

      await this.fileUploadService.handleFileUploads(process.id, mappedFiles);
    }

    return process;
  }

  async update(id: string, updateProcessDto: UpdateProcessDto) {
    await this.findOne(id);

    return this.prisma.process.update({
      where: { id },
      data: updateProcessDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if there are any palettes
    const palettesCount = await this.prisma.palette.count({
      where: { processId: id },
    });

    if (palettesCount > 0) {
      throw new BadRequestException(
        'Process has palettes. Delete all palettes before deleting the process.',
      );
    }

    await this.prisma.process.delete({ where: { id } });
    return { message: 'Process deleted successfully' };
  }

  async findOne(id: string, include?: Prisma.ProcessInclude) {
    const process = await this.prisma.process.findFirst({
      where: { id },
      ...(include ? { include } : {}),
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return process;
  }

  async addImages(id: string, files: Express.Multer.File[]) {
    const process = await this.findOne(id);
    await this.fileUploadService.handleFileUploads(process.id, files);
    return process;
  }
}
