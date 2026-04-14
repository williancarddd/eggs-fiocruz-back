import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';

@Injectable()
export class StuckPaletteCleanupService {
  private readonly logger = new Logger(StuckPaletteCleanupService.name);
  private readonly timeoutInMinutes = 30;

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async cancelStuckPalettes() {
    const thresholdDate = new Date(
      Date.now() - this.timeoutInMinutes * 60 * 1000,
    );

    const stuckPalettes = await this.prisma.palette.findMany({
      where: {
        OR: [
          {
            status: 'PENDING',
            createdAt: {
              lt: thresholdDate,
            },
          },
          {
            status: 'IN_PROGRESS',
            OR: [
              {
                initialTimestamp: {
                  lt: thresholdDate,
                },
              },
              {
                initialTimestamp: null,
                createdAt: {
                  lt: thresholdDate,
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    if (!stuckPalettes.length) {
      return;
    }

    const finalTimestamp = new Date();

    await this.prisma.$transaction(
      stuckPalettes.map((palette) =>
        this.prisma.palette.update({
          where: { id: palette.id },
          data: {
            status: 'FAILED',
            finalTimestamp,
            metadata: {
              ...(palette.metadata as Record<string, unknown> | null),
              failureReason: 'TIMEOUT_30_MIN',
              cancelledBy: 'CRON',
            },
          },
        }),
      ),
    );

    this.logger.warn(
      `Cancelled ${stuckPalettes.length} stuck palettes older than ${this.timeoutInMinutes} minutes`,
    );
  }
}
