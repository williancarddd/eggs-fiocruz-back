import { ProcessStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UploadedAssetSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  bytes: z.number().int().positive(),
  format: z.string().min(1),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  originalFilename: z.string().min(1),
  assetId: z.string().min(1).optional(),
  etag: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1),
});

export const AddUploadedAssetsSchema = z.object({
  assets: z.array(UploadedAssetSchema).min(1).max(100),
});

export class AddUploadedAssetsDto extends createZodDto(
  AddUploadedAssetsSchema,
) {}

export const AddUploadedAssetSchema = UploadedAssetSchema;

export class AddUploadedAssetDto extends createZodDto(AddUploadedAssetSchema) {}

export const UploadedAssetCreatedSchema = z.object({
  id: z.string().uuid(),
  sourcePublicId: z.string().nullable().optional(),
  status: z.nativeEnum(ProcessStatus),
});

export const AddUploadedAssetsResponseSchema = z.object({
  accepted: z.number().int(),
  palettes: z.array(UploadedAssetCreatedSchema),
});

export class AddUploadedAssetsResponseDto extends createZodDto(
  AddUploadedAssetsResponseSchema,
) {}
