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
  metadata: z.unknown().nullable(),
  status: z.nativeEnum(ProcessStatus),
  eggsCount: z.number().nullable(),
  expectedEggs: z.number().nullable(),
  initialTimestamp: z.date().nullable(),
  finalTimestamp: z.date().nullable(),
});
