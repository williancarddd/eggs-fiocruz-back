import {
  BadRequestException,
  Injectable,
  Logger,
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
import { UploadSignDto } from './dto/upload-sign.dto';
import { StorageService } from 'src/common/databases/storage/storage.service';
import { AddUploadedAssetsDto } from './dto/add-uploaded-assets.dto';

@Injectable()
export class ProcessService {
  private readonly logger = new Logger(ProcessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private tenantService: TenantService,
    private fileUploadService: FileUploadService,
    private storageService: StorageService,
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
    const processEntity = await this.findOne(id);
    await this.fileUploadService.handleFileUploads(processEntity.id, files);
    return processEntity;
  }

  async signUpload(data: UploadSignDto) {
    if (process.env.DIRECT_CLOUD_UPLOAD_ENABLED === 'false') {
      throw new BadRequestException('Direct cloud upload is disabled');
    }

    if (!data.contentType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported');
    }

    const processEntity = await this.findOne(data.processId);
    if (processEntity.userId !== this.tenantService.userId) {
      throw new NotFoundException('Process not found');
    }

    const fileExt = data.filename.split('.').pop() || 'jpg';
    const publicId = `${data.idempotencyKey}.${fileExt}`;
    const folder = `${processEntity.userId}/${processEntity.id}`;

    const signedUpload = await this.storageService.createSignedUploadParams({
      folder,
      publicId,
      contentType: data.contentType,
    });

    this.logger.log(
      `Signed upload created for process=${processEntity.id}, objectKey=${signedUpload.objectKey}`,
    );

    return signedUpload;
  }

  async addUploadedAssets(id: string, data: AddUploadedAssetsDto) {
    if (process.env.DIRECT_CLOUD_UPLOAD_ENABLED === 'false') {
      throw new BadRequestException('Direct cloud upload is disabled');
    }

    const processEntity = await this.findOne(id);
    if (processEntity.userId !== this.tenantService.userId) {
      throw new NotFoundException('Process not found');
    }

    for (const asset of data.assets) {
      try {
        new URL(asset.secureUrl);
      } catch {
        throw new BadRequestException('Invalid asset URL');
      }

      if (!this.storageService.isTrustedObjectUrl(asset.secureUrl)) {
        throw new BadRequestException('Only trusted S3 URLs are allowed');
      }
    }

    const palettes = await this.fileUploadService.handleUploadedCloudAssets(
      processEntity.id,
      data.assets,
    );

    this.logger.log(
      `Registered ${palettes.length} cloud assets for process=${processEntity.id}`,
    );

    return {
      accepted: palettes.length,
      palettes: palettes.map((palette) => ({
        id: palette.id,
        sourcePublicId: palette.sourcePublicId,
        status: palette.status,
      })),
    };
  }
}
