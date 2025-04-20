import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CheckIfAlreadExistsSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
});

export class ResponseCheckExistsDto {
  emailExists: boolean | undefined;
  phoneExists: boolean | undefined;
}

export class CheckIfAlreadExistsDto extends createZodDto(
  CheckIfAlreadExistsSchema,
) {}
