import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { ProcessExecutionsSchema } from "../entities/process-executions.entity";

export const CreateProcessExecutionSchema = z.object({
  processId: z.string().uuid(),
  algorithm: ProcessExecutionsSchema.shape.algorithm,
})
  .strict()
export class CreateProcessExecutionDto extends createZodDto(CreateProcessExecutionSchema) { }
