import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import axios from 'axios';
import { StorageService } from 'src/common/databases/storage/storage.service';
import { ProcessStatus } from '@prisma/client';
import * as FormData from 'form-data';
@Injectable()
@Processor('image-processing')
export class ProcessProcessor {
  private readonly logger = new Logger(ProcessProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Process('process-image')
  async handleImageProcessing(job: Job) {
    const { paletteId, buffer, filename } = job.data;

    try {
      this.logger.log(`🔄 Starting processing for palette ID: ${paletteId}`);

      const palette = await this.updatePaletteStatus(paletteId, 'IN_PROGRESS', {
        initialTimestamp: new Date(),
      });

      if (!palette || !palette.process) {
        throw new NotFoundException(`Palette with ID ${paletteId} not found`);
      }

      const actualBuffer = this.ensureBuffer(buffer);

      const uploadResult = await this.uploadAndProcessAI(
        palette,
        actualBuffer,
        filename,
        job.data.mimetype,
      );

      await this.updatePaletteStatus(paletteId, 'COMPLETED', {
        path: uploadResult.url,
        eggsCount: uploadResult.eggsCount,
        finalTimestamp: new Date(),
        metadata: uploadResult.metadata,
        width: uploadResult.width,
        height: uploadResult.height,
      });

      this.logger.log(`✅ Completed processing for palette ID: ${paletteId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error processing image ${filename}: ${message}`);
      await this.updatePaletteStatus(paletteId, 'FAILED', {
        finalTimestamp: new Date(),
      });
    }
  }

  private ensureBuffer(data: Buffer | { data: number[] }): Buffer {
    return Buffer.isBuffer(data) ? data : Buffer.from(data.data);
  }

  private async uploadAndProcessAI(
    palette,
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ) {
    const { process, id: paletteId } = palette;

    const storageUpload = await this.storageService.uploadImage({
      file: {
        buffer,
        originalname: filename,
        mimetype,
      } as Express.Multer.File,
      userId: process.userId,
      processExecutionId: paletteId,
    });

    const aiResult = await this.processImageWithAI(buffer, mimetype);

    return {
      ...storageUpload,
      ...aiResult,
    };
  }

  private async processImageWithAI(buffer: Buffer, mimetype = 'image/jpeg') {
    try {
      const formData = new FormData();
      const fileName = `image.${mimetype.split('/')[1]}`;
      formData.append('file', buffer, {
        filename: fileName,
        contentType: mimetype,
      });

      const response = await axios.post(process.env.AI_SERVICE_URL!, formData, {
        headers: formData.getHeaders(),
      });

      const { data } = response;

      return {
        eggsCount: data.totalObjects,
        metadata: data,
        width: data?.image?.dimensions?.width ?? null,
        height: data?.image?.dimensions?.height ?? null,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during AI processing';
      throw new Error(`AI processing failed: ${errorMessage}`);
    }
  }

  /**
   * Generic update method for palette status + extra data.
   */
  private async updatePaletteStatus(
    paletteId: string,
    status: ProcessStatus,
    extraData: Record<string, any> = {},
  ) {
    await this.prisma.palette.update({
      where: { id: paletteId },
      data: { status, ...extraData },
    });

    // Optionally return the updated palette (with process)
    return this.prisma.palette.findUnique({
      where: { id: paletteId },
      include: { process: true },
    });
  }
}
