import { createZodDto } from 'nestjs-zod';
import { ProcessEntitySchema } from '../entities/process.entity';

export const ResponseProcessSchema = ProcessEntitySchema.partial();

export class ResponseProcessDto extends createZodDto(ResponseProcessSchema) {}
