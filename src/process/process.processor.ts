import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import axios from 'axios';
import { AxiosError } from 'axios';
import { StorageService } from 'src/common/databases/storage/storage.service';
import { ProcessStatus } from '@prisma/client';
import * as FormData from 'form-data';
import { promises as fs } from 'fs';
@Injectable()
@Processor('image-processing')
export class ProcessProcessor {
  private readonly aiRequestTimeoutMs = Number(
    process.env.AI_SERVICE_TIMEOUT_MS ?? 480000,
  );

  private getAxiosErrorDetails(error: unknown) {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status,
        data: error.response?.data,
        requestUrl: error.config?.url,
        method: error.config?.method,
      };
    }

    return null;
  }

  private readonly logger = new Logger(ProcessProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private buildProcessingResult(data: any, url?: string) {
    return {
      url,
      eggsCount: data.totalObjects,
      metadata: data,
      width: data?.image?.dimensions?.width ?? null,
      height: data?.image?.dimensions?.height ?? null,
    };
  }

  @Process('process-image')
  async handleImageProcessing(job: Job) {
    const { paletteId, filePath, filename, mimetype, secureUrl, squareSize } =
      job.data;

    try {
      this.logger.log(`🔄 Starting processing for palette ID: ${paletteId}`);

      const palette = await this.updatePaletteStatus(paletteId, 'IN_PROGRESS', {
        initialTimestamp: new Date(),
      });

      if (!palette || !palette.process) {
        throw new NotFoundException(`Palette with ID ${paletteId} not found`);
      }

      const uploadResult = secureUrl
        ? await this.processImageWithAIUrl(secureUrl, squareSize)
        : await this.uploadAndProcessAI(
            palette,
            await fs.readFile(filePath),
            filename,
            mimetype,
            squareSize,
          );

      await this.updatePaletteStatus(paletteId, 'COMPLETED', {
        path: secureUrl || uploadResult.url || '',
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
    } finally {
      if (filePath) {
        await fs.unlink(filePath).catch(() => undefined);
      }
    }
  }

  private async uploadAndProcessAI(
    palette,
    buffer: Buffer,
    filename: string,
    mimetype: string,
    squareSize?: number,
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

    const aiResult = await this.processImageWithAI(buffer, mimetype, squareSize);

    return {
      ...storageUpload,
      ...aiResult,
    };
  }

  private async processImageWithAI(
    buffer: Buffer,
    mimetype = 'image/jpeg',
    squareSize?: number,
  ) {
    try {
      const formData = new FormData();
      const fileName = `image.${mimetype.split('/')[1]}`;
      formData.append('file', buffer, {
        filename: fileName,
        contentType: mimetype,
      });

      const response = await axios.post(process.env.AI_SERVICE_URL!, formData, {
        headers: formData.getHeaders(),
        timeout: this.aiRequestTimeoutMs,
        ...(squareSize ? { params: { square_size: squareSize } } : {}),
      });

      const { data } = response;

      return this.buildProcessingResult(data);
    } catch (error: unknown) {
      const axiosDetails = this.getAxiosErrorDetails(error);
      if (axiosDetails) {
        this.logger.error(
          `AI file request failed status=${axiosDetails.status} method=${axiosDetails.method} url=${axiosDetails.requestUrl} data=${JSON.stringify(axiosDetails.data)}`,
        );
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during AI processing';
      throw new Error(`AI processing failed: ${errorMessage}`);
    }
  }

  private async processImageWithAIUrl(imageUrl: string, squareSize?: number) {
    try {
      this.logger.log(
        `Sending AI URL request url=${process.env.AI_SERVICE_URL} imageUrl=${imageUrl} squareSize=${squareSize ?? 'default'}`,
      );

      const response = await axios.post(
        process.env.AI_SERVICE_URL!,
        {
          imageUrl,
        },
        {
          timeout: this.aiRequestTimeoutMs,
          ...(squareSize ? { params: { square_size: squareSize } } : {}),
        },
      );

      const { data } = response;
      this.logger.log(
        `AI URL response received status=${response.status} totalObjects=${data?.totalObjects}`,
      );

      return this.buildProcessingResult(data, imageUrl);
    } catch (error: unknown) {
      const axiosDetails = this.getAxiosErrorDetails(error);
      if (axiosDetails) {
        this.logger.error(
          `AI URL request failed status=${axiosDetails.status} method=${axiosDetails.method} url=${axiosDetails.requestUrl} data=${JSON.stringify(axiosDetails.data)}`,
        );
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during AI URL processing';
      throw new Error(`AI URL processing failed: ${errorMessage}`);
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
