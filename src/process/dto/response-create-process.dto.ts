import { z } from "zod";
import { ProcessSchema } from "../entities/process.entity";
import { createZodDto } from "nestjs-zod";
import { ProcessExecutionsSchema } from "../entities/process-executions.entity";

const CoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const SquareSchema = z.object({
  coordinates: CoordinatesSchema,
  objects_detected: z.number(),
  square_base64: z.string(),
});

export const EggsCountResponseAISchema = z.object({
  final_image: z.string(),
  final_time: z.number(),
  image_dimensions: z.object({
    height: z.number(),
    width: z.number(),
  }),
  initial_time: z.number(),
  total_eggs: z.number(),
  squares: z.array(SquareSchema),
});


export type EggsCountResponseAIType= z.infer<typeof EggsCountResponseAISchema>;


const ResponseCreatedProcessSchema = z.object({
  process: ProcessSchema.omit({
    user: true,
  }).extend({
    results: ProcessExecutionsSchema.omit({ Process: true }).array(),
  }),
  eggsCountResponseAI: EggsCountResponseAISchema,
});

export class ResponseCreatedProcessDto extends createZodDto(ResponseCreatedProcessSchema) { }
