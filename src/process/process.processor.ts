import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { SupabaseService } from 'src/common/databases/supabase/supabase.service';
import axios from 'axios';

@Injectable()
@Processor('image-processing')
export class ProcessProcessor {
  private readonly logger = new Logger(ProcessProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Process('process-image')
  async handleImageProcessing(job: Job) {
    const { paletteId, buffer, filename } = job.data;

    try {
      // Update status to processing
      await this.prisma.palette.update({
        where: { id: paletteId },
        data: { status: 'IN_PROGRESS', initialTimestamp: new Date() },
      });

      // Upload to storage
      const palette = await this.prisma.palette.findUnique({
        where: { id: paletteId },
        include: { process: true },
      });

      if (!palette) {
        throw new NotFoundException(`Palette with ID ${paletteId} not found`);
      }

      const uploadResult = await this.supabaseService.uploadImage({
        file: { buffer, originalname: filename } as Express.Multer.File,
        userId: palette.process.userId,
        processExecutionId: paletteId,
      });

      await this.prisma.palette.update({
        where: { id: paletteId },
        data: {
          path: uploadResult.publicUrl,
        },
      });

      // Send to AI processing service
      const aiResponse = await this.processImageWithAI(uploadResult.publicUrl);

      // Update palette with results
      await this.prisma.palette.update({
        where: { id: paletteId },
        data: {
          path: uploadResult.publicUrl,
          status: 'COMPLETED',
          eggsCount: aiResponse.eggsCount,
          finalTimestamp: new Date(),
          metadata: aiResponse.metadata,
          width: aiResponse.width,
          height: aiResponse.height,
        },
      });
    } catch (error: unknown) {
      this.logger.error(`Error processing image ${filename}:`, error);

      await this.prisma.palette.update({
        where: { id: paletteId },
        data: {
          status: 'FAILED',
          finalTimestamp: new Date(),
          metadata: {
            error:
              error instanceof Error
                ? error.message
                : 'Unknown error occurred during processing',
          },
        },
      });
    }
  }

  private async processImageWithAI(imageUrl: string) {
    try {
      // Make request to AI service
      const response = await axios.post(
        process.env.AI_SERVICE_URL + '/process-image',
        {
          imageUrl,
        },
      );

      return {
        eggsCount: response.data.eggsCount,
        metadata: response.data.metadata,
        width: response.data.width,
        height: response.data.height,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during AI processing';
      throw new Error(`AI processing failed: ${errorMessage}`);
    }
  }
}
