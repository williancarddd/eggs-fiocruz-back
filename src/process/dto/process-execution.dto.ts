import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { Algorithms } from "src/utils/algorithms";
import { ProcessStatus } from "@prisma/client";
import { ProcessSchema } from "./process.dto";


export const ProcessExecutionsSchema = z.object({
  id: z
    .string()
    .uuid({ message: "Invalid Execution ID format" }),
  processId: z
    .string()
    .uuid({ message: "Invalid Process ID format" })
    .optional(),
  eggsCount: z
    .number()
    .int({ message: "Eggs Count must be an integer" })
    .optional()
    .describe("Eggs Count"),
  description: z
    .string()
    .optional()
    .describe("Description"),
  expectedEggs: z
    .number()
    .int({ message: "Expected Eggs must be an integer" })
    .optional()
    .describe("Expected Eggs"),
  algorithm: z
    .nativeEnum(Algorithms)
    .default(Algorithms.traditional_v1)
    .optional()
    .describe("Algorithm"),
  resultPath: z
    .string()
    .optional()
    .describe("Path to the result file"),
  metadata: z
    .string()
    .optional()
    .describe("Metadata"),
  initialTimestamp: z
    .string().datetime()
    .optional()
    .describe("Initial Timestamp"),
  finalTimestamp: z
    .string()
    .datetime()
    .optional()
    .describe("Final Timestamp"),
  status: z
    .nativeEnum(ProcessStatus)
    .describe("Status"),
  createdAt: z
    .string()
    .datetime()
    .optional()
    .describe("Date of Creation"),
  updatedAt: z
    .string()
    .datetime()
    .optional()
    .describe("Date of Update"),
  Process: z
    .lazy(() => ProcessSchema)
    .optional()
    .describe("Process"),
});

export const UpdateProcessExecutionSchema = z.object({
  description: z.string().optional().describe("Description"),
  eggsCount: z
    .number()
    .int({ message: "Eggs Count must be an integer" })
    .optional()
    .describe("Eggs Count"),
  expectedEggs: z
    .string()
    .transform((v) => parseInt(v))
    .optional()
    .describe("Expected egg count"),
  algorithm: z
    .nativeEnum(Algorithms)
    .optional()
    .describe("Algorithm"),
  status: z
    .nativeEnum(ProcessStatus)
    .optional()
    .describe("Status"),
  resultPath: z
    .string()
    .optional()
    .describe("Path to the result file"),
  metadata: z
    .string()
    .optional()
    .describe("Metadata"),
  initialTimestamp: z
    .string()
    .datetime()
    .optional()
    .describe("Initial Timestamp"),
  finalTimestamp: z
    .string()
    .datetime()
    .optional()
    .describe("Final Timestamp"),
});

export class UpdateProcessExecutionDto extends createZodDto(
  UpdateProcessExecutionSchema
) { }

export type ProcessExecutions = z.infer<typeof ProcessExecutionsSchema>;

export const CreateProcessExecutionSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .optional(),
    algorithm: ProcessExecutionsSchema.shape.algorithm,
    description: z
      .string()
      .optional()
      .describe("Description"),
    expectedEggs: z
      .string()

      .transform((v) => parseInt(v))
      .describe("Expected egg count"),
  })
  .strict();



export class CreateProcessExecutionDto extends createZodDto(
  CreateProcessExecutionSchema
) { }
