import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { ProcessExecutionsSchema } from "../entities/process-executions.entity";

export const UpdateProcessExecutionSchema = z.object({
  algorithm: ProcessExecutionsSchema.shape.algorithm.optional(),
  eggsCount: ProcessExecutionsSchema.shape.eggsCount.optional(),
  status: ProcessExecutionsSchema.shape.status.optional(),
});

export class UpdateProcessExecutionDto extends createZodDto(UpdateProcessExecutionSchema) { }
