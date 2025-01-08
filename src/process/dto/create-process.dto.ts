import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { Algorithms } from 'src/utils/algorithms';

extendZodWithOpenApi(z); // Extends Zod for OpenAPI compatibility

export const CreateProcessSchema = z.object({
  description: z.string().default('').describe('Description of the process'),
  userId: z.string().uuid().describe('ID of the user initiating the process'),
  resultPath: z.string().optional().describe('Path to the result file'),
  expectedEggs: z.string().transform((v) => parseInt(v)).describe('Expected egg count'),
  processExecution: z.object({
    algorithm: z.nativeEnum(Algorithms).default(Algorithms.BLIND_SQUARE_1).describe('Algorithm'),
  }),
});

export class CreateProcessDto extends createZodDto(
  CreateProcessSchema.omit({
    resultPath: true,
  }),
) { }
