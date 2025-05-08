import { createZodDto } from 'nestjs-zod';
import { PaletteEntitySchema } from '../entities/palette.entity';

export const UpdatePaletteSchema = PaletteEntitySchema.pick({
  expectedEggs: true,
});

export class UpdatePaletteDto extends createZodDto(UpdatePaletteSchema) {}
