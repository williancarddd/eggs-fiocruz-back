import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/databases/prisma-module/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import * as AdmZip from 'adm-zip';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { tmpdir } from 'os';

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
      if (
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed'
      ) {
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

  private async persistTempFile(
    image: Express.Multer.File,
  ): Promise<{ path: string; mimetype: string }> {
    const extension = extname(image.originalname) || '.bin';
    const tempPath = `${tmpdir()}/palette-${randomUUID()}${extension}`;
    await fs.writeFile(tempPath, image.buffer);
    return {
      path: tempPath,
      mimetype: image.mimetype || 'application/octet-stream',
    };
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
      const mappedMimeType = this.getImageMimeType(entry.name);
      return {
        ...file,
        originalname: entry.name,
        mimetype: mappedMimeType,
        buffer,
        size: buffer.length,
      };
    });
  }

  private getImageMimeType(filename: string): string {
    const lowerFilename = filename.toLowerCase();

    if (lowerFilename.endsWith('.png')) {
      return 'image/png';
    }

    if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
      return 'image/jpeg';
    }

    return 'application/octet-stream';
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
      try {
        const persistedFile = await this.persistTempFile(image);
        await this.imageProcessingQueue.add(
          'process-image',
          {
            paletteId: palette.id,
            filePath: persistedFile.path,
            filename: image.originalname,
            mimetype: persistedFile.mimetype,
          },
          {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            timeout: 10 * 60 * 1000,
            delay: 1000,
          },
        );
      } catch {
        await this.prisma.palette.update({
          where: { id: palette.id },
          data: {
            status: 'FAILED',
            finalTimestamp: new Date(),
          },
        });
      }
    }
  }
}
