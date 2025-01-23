import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { ProcessSchema } from "./process.dto";
import { ProcessExecutionsSchema } from "./process-execution.dto";

const CoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const ProcessedSquareSchema = z.object({
  coordinates: CoordinatesSchema,
  points: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])),
  objects_detected: z.number(),
});

export const EggsCountResponseAISchema = z.object({
  total_objects: z.number(),
  processed_squares: z.array(ProcessedSquareSchema),
  image_dimensions: z.object({
    height: z.number(),
    width: z.number(),
  }),
  used_square_size: z.number(),
  initial_time: z.number(),
  final_time: z.number(),
});

export type EggsCountResponseAIType = z.infer<typeof EggsCountResponseAISchema>;

const CreateProcessWithProcessExecutionSchema = z.object({
  process: ProcessSchema.omit({
    user: true,
    processExecution: true,
  }),
  processExecution: ProcessExecutionsSchema.omit({
    process: true,
    metadata: true,
    Process: true,
  }),
  metadata: EggsCountResponseAISchema,
});

export class CreateProcessWithProcessExecutionDto extends createZodDto(CreateProcessWithProcessExecutionSchema) { }
