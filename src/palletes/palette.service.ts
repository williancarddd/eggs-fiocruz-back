import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { Prisma, ProcessStatus } from '@prisma/client';
import { createPaginator } from 'prisma-pagination';
import { StorageService } from 'src/common/databases/storage/storage.service';
import { ResponsePaletteDto } from './dto/response-palette.dto';
import {
  UpdatePaletteDto,
  UpdatePaletteSchema,
} from './dto/update-palette.dto';

@Injectable()
export class PaletteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findOne(id: string, include?: Prisma.PaletteInclude) {
    const palette = await this.prisma.palette.findFirst({
      where: { id },
      ...(include ? { include } : {}),
    });

    if (!palette) {
      throw new NotFoundException('Palette not found');
    }

    return palette;
  }

  async findByProcessId(processId: string) {
    return this.prisma.palette.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    const palette = await this.findOne(id, { process: true });

    // Delete from storage if there's a path
    if (palette.path) {
      try {
        await this.storageService.removeFile(palette.path);
      } catch (error) {
        // Log error but continue with database deletion
        console.error('Failed to delete file from storage:', error);
      }
    }

    // Delete from database
    await this.prisma.palette.delete({
      where: { id },
    });

    return { message: 'Palette deleted successfully' };
  }

  async update(id: string, data: UpdatePaletteDto) {
    const parsed = UpdatePaletteSchema.parse(data);
    await this.findOne(id);

    return this.prisma.palette.update({
      where: { id },
      data: {
        ...parsed,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: ProcessStatus;
    processId?: string;
    filename?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const paginate = createPaginator({
      page: query.page,
      perPage: query.limit,
    });

    const where: Prisma.PaletteWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.processId) {
      where.processId = query.processId;
    }

    if (query.filename) {
      where.filename = {
        contains: query.filename,
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

    return paginate<ResponsePaletteDto, Prisma.PaletteFindManyArgs>(
      this.prisma.palette,
      {
        where,
        orderBy: {
          createdAt: 'desc',
        },
      },
    );
  }
}
