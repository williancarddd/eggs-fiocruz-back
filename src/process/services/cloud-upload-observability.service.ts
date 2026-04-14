import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';

@Injectable()
export class CloudUploadObservabilityService {
  private readonly logger = new Logger(CloudUploadObservabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/15 * * * *')
  async reportCloudUploadMetrics() {
    if (process.env.DIRECT_CLOUD_UPLOAD_ENABLED === 'false') {
      return;
    }

    const [pending, inProgress, failed, completed] = await Promise.all([
      this.prisma.palette.count({
        where: {
          sourceProvider: 'CLOUDINARY',
          status: 'PENDING',
        },
      }),
      this.prisma.palette.count({
        where: {
          sourceProvider: 'CLOUDINARY',
          status: 'IN_PROGRESS',
        },
      }),
      this.prisma.palette.count({
        where: {
          sourceProvider: 'CLOUDINARY',
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.palette.count({
        where: {
          sourceProvider: 'CLOUDINARY',
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    this.logger.log(
      `Cloud upload metrics pending=${pending} inProgress=${inProgress} failed24h=${failed} completed24h=${completed}`,
    );
  }
}
