import { ProcessStatus } from '@prisma/client';
import { z } from 'zod';
import { ProcessSchema } from './process.entity';
import { Algorithms } from 'src/utils/algorithms';

export const ProcessExecutionsSchema = z.object({
  id: z.string().uuid({ message: "Invalid Execution ID format" }),
  processId: z.string().uuid({ message: "Invalid Process ID format" }),
  eggsCount: z.number().int({ message: "Eggs Count must be an integer" }).describe('Eggs Count'),
  algorithm: z.nativeEnum(Algorithms).default(Algorithms.DEFAULT).describe('Algorithm'),
  initialTimestamp: z.string().datetime().optional().describe('Initial Timestamp'),
  finalTimestamp: z.string().datetime().optional().describe('Final Timestamp'),
  status: z.nativeEnum(ProcessStatus).describe('Status'),
  createdAt: z.string().datetime().optional().describe('Date of Creation'),
  updatedAt: z.string().datetime().optional().describe('Date of Update'),
  Process: z.lazy(() => ProcessSchema).optional().describe('Process'),
});

export type ProcessExecutions = z.infer<typeof ProcessExecutionsSchema>;
