import { UserSchema } from 'src/users/entities/user.entity';
import { z } from 'zod';
import { ProcessExecutionsSchema } from './process-executions.entity';
import { createZodDto } from 'nestjs-zod';

export const ProcessSchema = z.object({
  id: z.string().uuid({ message: "Invalid Process ID format" }),
  userId: z.string().uuid({ message: "Invalid User ID format" }),
  description: z.string().min(1, { message: "Description is required" }).describe('Description'),
  resultPath: z.string().optional().describe('Result Path'),
  expectedEggs: z.number().int().optional().describe('Expected Eggs'),
  createdAt: z.string().datetime().optional().describe('Date of Creation'),
  updatedAt: z.string().datetime().optional().describe('Date of Update'),
  user: UserSchema.optional().describe('User'),
  results: z.lazy(() => ProcessExecutionsSchema).array().optional().describe('Results'),
});

export class ProcessDto extends createZodDto(
  ProcessSchema.omit({ user: true, results: true }).extend({
    results: ProcessExecutionsSchema.omit({
      Process: true,
    }).array().optional().describe('Results'),
  })
) { }
export type Process = z.infer<typeof ProcessSchema>;
