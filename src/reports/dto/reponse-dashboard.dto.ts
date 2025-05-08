import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ResponseDashboardSchema = z.object({
  palettes: z.object({
    total: z.number(),
    pending: z.number(),
    completed: z.number(),
    failed: z.number(),
    inProgress: z.number(),
  }),
  errorAnalysis: z.object({
    avgErrorPercent: z.number().nullable(),
  }),
  performance: z.object({
    avgProcessingTimeMs: z.number().nullable(),
  }),
  topUsers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      _count: z.object({
        processes: z.number(),
      }),
    }),
  ),
  topLocations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      _count: z.object({
        processes: z.number(),
      }),
    }),
  ),
  iaMetrics: z
    .object({
      avgInferenceTimeMs: z.number(),
      avgObjectsDetected: z.number(),
    })
    .nullable(),
});

export class ResponseDashboardDto extends createZodDto(
  ResponseDashboardSchema,
) {}
