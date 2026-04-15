import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AllowedSquareSizeSchema = z.union([
  z.literal(128),
  z.literal(254),
  z.literal(384),
  z.literal(512),
  z.literal(784),
  z.literal(1024),
]);

export const ReprocessPaletteSchema = z.object({
  squareSize: AllowedSquareSizeSchema.optional(),
});

export class ReprocessPaletteDto extends createZodDto(ReprocessPaletteSchema) {}
