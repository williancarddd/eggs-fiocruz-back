import { createZodDto } from 'nestjs-zod';
import { PaletteEntitySchema } from '../entities/palette.entity';

export const ResponsePaletteSchema = PaletteEntitySchema.partial();

export class ResponsePaletteDto extends createZodDto(ResponsePaletteSchema) {}
