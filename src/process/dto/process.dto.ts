import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { UserSchema } from "src/users/entities/user.entity";
import { CreateProcessExecutionDto, CreateProcessExecutionSchema, ProcessExecutionsSchema } from "./process-execution.dto";


export const ProcessSchema = z.object({
  id: z.string().uuid({ message: "Invalid Process ID format" }),
  userId: z.string().uuid({ message: "Invalid User ID format" }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .describe("Description"),
  user: UserSchema.omit({
    password: true,
  }).optional().describe("User"),
  processExecutions: ProcessExecutionsSchema.array().optional().describe("Process Executions"),
  createdAt: z.string().datetime().optional().describe("Date of Creation"),
  updatedAt: z.string().datetime().optional().describe("Date of Update"),
});


export class ProcessDto extends createZodDto(ProcessSchema) { }

export const UpdateProcessSchema = z.object({
  id: z.string().uuid({ message: "Invalid Process ID format" }),
  description: z.string().optional()
});

export class UpdateProcessDto extends createZodDto(UpdateProcessSchema) { }


export const CreateProcessSchema = z.object({
  id: z.string().uuid().optional(),
  description: z
    .string()
    .default("")
    .describe("Description of the process"),
  userId: z
    .string()
    .uuid()
    .describe("ID of the user initiating the process"),
  processExecution: z.lazy(() => CreateProcessExecutionSchema)

});

export class CreateProcessDto extends createZodDto(CreateProcessSchema) { }