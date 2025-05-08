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

    // Paletas com contagem de ovos e esperado
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

    let avgErrorPercent: number | null = null;
    let stdDevErrorPercent: number | null = null;
    let rSquared: number | null = null;
    let highErrorCount: number | null = null;

    if (palettesWithCounts.length > 0) {
      const errors = palettesWithCounts.map((p) => {
        const error =
          ((p.eggsCount! - p.expectedEggs!) / p.expectedEggs!) * 100;
        return error;
      });

      // Média do erro percentual (em módulo)
      avgErrorPercent =
        errors.reduce((acc, val) => acc + Math.abs(val), 0) / errors.length;

      // Desvio padrão do erro percentual
      const mean = avgErrorPercent;
      const variance =
        errors.reduce((acc, val) => {
          return acc + Math.pow(Math.abs(val) - mean, 2);
        }, 0) / errors.length;
      stdDevErrorPercent = Math.sqrt(variance);

      // Paletas com diferença > 50%
      highErrorCount = errors.filter((e) => Math.abs(e) > 50).length;

      // R² Calculation
      const expectedEggs = palettesWithCounts.map((p) => p.expectedEggs!);

      const meanExpected =
        expectedEggs.reduce((acc, val) => acc + val, 0) / expectedEggs.length;

      const ssTot = expectedEggs.reduce(
        (acc, val) => acc + Math.pow(val - meanExpected, 2),
        0,
      );

      const ssRes = palettesWithCounts.reduce((acc, val) => {
        return acc + Math.pow(val.expectedEggs! - val.eggsCount!, 2);
      }, 0);

      rSquared = ssTot > 0 ? 1 - ssRes / ssTot : null;
    }

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
        stdDevErrorPercent,
        highErrorCount, // 👈 Nova métrica: contagem de erros > 50%
        rSquared, // 👈 Nova métrica: coeficiente de determinação R²
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
