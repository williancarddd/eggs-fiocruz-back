import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const UpdateProcessSchema = z.object({
  description: z.string().optional(),
  resultPath: z.string().optional(),
});

export class UpdateProcessDto extends createZodDto(UpdateProcessSchema) { }
