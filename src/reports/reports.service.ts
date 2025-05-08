import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { ProcessStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    // Total geral de paletas
    const totalPalettes = await this.prisma.palette.count();

    // Status counts
    const [pending, completed, failed, inProgress] = await Promise.all([
      this.prisma.palette.count({ where: { status: ProcessStatus.PENDING } }),
      this.prisma.palette.count({ where: { status: ProcessStatus.COMPLETED } }),
      this.prisma.palette.count({ where: { status: ProcessStatus.FAILED } }),
      this.prisma.palette.count({
        where: { status: ProcessStatus.IN_PROGRESS },
      }),
    ]);

    // Média de erro percentual
    const palettesWithCounts = await this.prisma.palette.findMany({
      where: {
        expectedEggs: { not: null },
        eggsCount: { not: null },
      },
      select: {
        eggsCount: true,
        expectedEggs: true,
      },
    });

    const avgErrorPercent =
      palettesWithCounts.length > 0
        ? palettesWithCounts.reduce((acc, curr) => {
            const error =
              ((curr.eggsCount! - curr.expectedEggs!) / curr.expectedEggs!) *
              100;
            return acc + Math.abs(error);
          }, 0) / palettesWithCounts.length
        : null;

    // Tempo médio de processamento
    const palettesWithTimestamps = await this.prisma.palette.findMany({
      where: {
        initialTimestamp: { not: null },
        finalTimestamp: { not: null },
      },
      select: {
        initialTimestamp: true,
        finalTimestamp: true,
      },
    });

    const avgProcessingTimeMs =
      palettesWithTimestamps.length > 0
        ? palettesWithTimestamps.reduce((acc, curr) => {
            const diffMs =
              new Date(curr.finalTimestamp!).getTime() -
              new Date(curr.initialTimestamp!).getTime();
            return acc + diffMs;
          }, 0) / palettesWithTimestamps.length
        : null;

    // Top usuários (mais processos)
    const topUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: {
        processes: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { processes: true },
        },
      },
    });

    // Top locais (mais processos)
    const topLocations = await this.prisma.location.findMany({
      take: 5,
      orderBy: {
        processes: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { processes: true },
        },
      },
    });

    // ➔ IA metrics (tempo de inferência médio etc.)
    const palettesWithMetadata = await this.prisma.palette.findMany({
      where: {
        metadata: { not: { equals: null } },
      },
      select: {
        metadata: true,
      },
    });

    let iaMetrics: {
      avgInferenceTimeMs: number;
      avgObjectsDetected: number;
    } | null = null;
    if (palettesWithMetadata.length > 0) {
      const totalInferenceTime = palettesWithMetadata.reduce((acc, curr) => {
        const metadata = curr.metadata as any;
        return (
          acc +
          (metadata?.timing?.inferenceTimeMs
            ? Number(metadata.timing.inferenceTimeMs)
            : 0)
        );
      }, 0);
      const avgInferenceTime = totalInferenceTime / palettesWithMetadata.length;

      const totalObjects = palettesWithMetadata.reduce((acc, curr) => {
        const metadata = curr.metadata as any;
        return (
          acc +
          (metadata?.inferenceStats?.totalObjects
            ? Number(metadata.inferenceStats.totalObjects)
            : 0)
        );
      }, 0);
      const avgObjects = totalObjects / palettesWithMetadata.length;

      iaMetrics = {
        avgInferenceTimeMs: avgInferenceTime,
        avgObjectsDetected: avgObjects,
      };
    }

    return {
      palettes: {
        total: totalPalettes,
        pending,
        completed,
        failed,
        inProgress,
      },
      errorAnalysis: {
        avgErrorPercent,
      },
      performance: {
        avgProcessingTimeMs,
      },
      topUsers,
      topLocations,
      iaMetrics,
    };
  }
}
