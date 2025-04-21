import { createZodDto } from 'nestjs-zod';
import { ProcessEntitySchema } from '../entities/process.entity';

export const UpdateProcessSchema = ProcessEntitySchema.pick({
  description: true,
}).partial();

export class UpdateProcessDto extends createZodDto(UpdateProcessSchema) {}
