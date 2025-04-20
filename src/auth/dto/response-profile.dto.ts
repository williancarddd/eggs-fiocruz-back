import { createZodDto } from 'nestjs-zod';
import { ResponseUserSchema } from '../../users/dto/response-user.dto';

export const ResponseProfileSchema = ResponseUserSchema;
export class ResponseProfileDto extends createZodDto(ResponseProfileSchema) {}
