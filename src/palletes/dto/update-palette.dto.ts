import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ProcessStatus } from '@prisma/client';

export const UpdatePaletteSchema = z
  .object({
    status: z.nativeEnum(ProcessStatus).optional(),
    eggsCount: z.number().optional(),
    expectedEggs: z.number().optional(),
    metadata: z.any().optional(),
  })
  .strict();

export class UpdatePaletteDto extends createZodDto(UpdatePaletteSchema) {}
