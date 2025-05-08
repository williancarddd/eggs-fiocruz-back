import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import * as AdmZip from 'adm-zip';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('image-processing')
    private readonly imageProcessingQueue: Queue,
  ) {}

  async handleFileUploads(processId: string, files: Express.Multer.File[]) {
    const imagesToProcess: Express.Multer.File[] = [];

    for (const file of files) {
      if (file.mimetype === 'application/zip') {
        const extractedImages = await this.extractImagesFromZip(file);
        imagesToProcess.push(...extractedImages);
      } else if (file.mimetype.startsWith('image/')) {
        imagesToProcess.push(file);
      } else {
        throw new BadRequestException(
          'Only image files or zip archives are allowed',
        );
      }
    }

    await this.processImages(processId, imagesToProcess);
    return imagesToProcess;
  }

  private async extractImagesFromZip(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File[]> {
    const zip = new AdmZip(file.buffer);
    const zipEntries = zip.getEntries();

    const validImages = zipEntries.filter((entry) => {
      const ext = entry.name.toLowerCase();
      return (
        !entry.isDirectory &&
        (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png'))
      );
    });

    if (validImages.length === 0) {
      throw new BadRequestException('No valid images found in zip file');
    }

    return validImages.map((entry) => {
      const buffer = entry.getData();
      return {
        ...file,
        originalname: entry.name,
        buffer,
        size: buffer.length,
      };
    });
  }

  private async processImages(
    processId: string,
    images: Express.Multer.File[],
  ) {
    for (const image of images) {
      const palette = await this.prisma.palette.create({
        data: {
          processId,
          filename: image.originalname,
          format: image.mimetype,
          path: '', // Will be updated after storage
          status: 'PENDING',
        },
      });

      await this.imageProcessingQueue.add(
        'process-image',
        {
          paletteId: palette.id,
          buffer: image.buffer,
          filename: image.originalname,
        },
        {
          removeOnComplete: true,
          removeOnFail: true,
          delay: 1000,
        },
      );
    }
  }
}
