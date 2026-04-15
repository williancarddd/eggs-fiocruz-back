import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ALLOWED_SQUARE_SIZES = [
  96,
  128,
  160,
  192,
  224,
  254,
  320,
  384,
  448,
  512,
  640,
  784,
  896,
  1024,
  1280,
  1684,
  2048,
] as const;

type AllowedSquareSize = (typeof ALLOWED_SQUARE_SIZES)[number];

export const AllowedSquareSizeSchema = z
  .number()
  .int()
  .refine((value) => ALLOWED_SQUARE_SIZES.includes(value as AllowedSquareSize), {
    message: `squareSize must be one of: ${ALLOWED_SQUARE_SIZES.join(', ')}`,
  });

export const ReprocessPaletteSchema = z.object({
  squareSize: AllowedSquareSizeSchema.optional(),
});

export class ReprocessPaletteDto extends createZodDto(ReprocessPaletteSchema) {}
