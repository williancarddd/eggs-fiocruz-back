import { createZodDto } from 'nestjs-zod';
import { PaletteEntitySchema } from '../../palletes/entities/palette.entity';

export const ResponsePaletteSchema = PaletteEntitySchema.partial();

export class ResponsePaletteDto extends createZodDto(ResponsePaletteSchema) {}
