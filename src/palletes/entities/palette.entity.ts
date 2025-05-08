import { ProcessStatus } from '@prisma/client';
import { DefaultEntitySchema } from 'src/common/default.entity';
import { z } from 'zod';

export const PaletteEntitySchema = DefaultEntitySchema.extend({
  processId: z.string(),
  filename: z.string(),
  format: z.string(),
  path: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  status: z.nativeEnum(ProcessStatus),
  eggsCount: z.number().nullable(),
  expectedEggs: z.number().nullable(),
  initialTimestamp: z.date().nullable(),
  finalTimestamp: z.date().nullable(),
  metadata: z
    .object({
      startTime: z.string(),
      endTime: z.string(),
      timing: z.object({
        readTimeMs: z.number(),
        inferenceTimeMs: z.number(),
        totalTimeMs: z.number(),
      }),
      image: z.object({
        filename: z.string(),
        fileSize: z.number(),
        dimensions: z.object({
          width: z.number(),
          height: z.number(),
        }),
        mimeType: z.string(),
        hashMD5: z.string(),
      }),
      inferenceStats: z.object({
        totalObjects: z.number(),
        totalSquares: z.number(),
        averageObjectsPerSquare: z.number(),
      }),
      system: z.object({
        host: z.string(),
        cpu: z.string(),
        numThreads: z.number(),
        totalRAM_MB: z.number(),
        usedRAM_MB: z.number(),
      }),
      model: z.object({
        versionYolo: z.any(),
        modelPath: z.string(),
        pythonVersion: z.string(),
      }),
      parameters: z.object({
        squareSize: z.number(),
      }),
      objects: z.array(
        z.object({
          x1: z.number(),
          y1: z.number(),
          x2: z.number(),
          y2: z.number(),
        }),
      ),
    })
    .partial()
    .optional()
    .nullable(),
});
