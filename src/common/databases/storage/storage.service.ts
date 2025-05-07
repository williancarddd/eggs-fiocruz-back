import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    this.logger.log('Cloudinary client initialized successfully');
  }

  async uploadImage({
    file,
    userId,
    processExecutionId,
  }: {
    file: Express.Multer.File;
    userId: string;
    processExecutionId: string;
  }): Promise<UploadApiResponse> {
    const timestamp = new Date().getTime();
    const originalExt = file.originalname.split('.').pop();
    const imageName = `${processExecutionId}_${timestamp}.${originalExt}`;
    const folderPath = `${userId}`;

    this.logger.log(
      `Uploading image to Cloudinary: folder=${folderPath}, filename=${imageName}`,
    );

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: folderPath,
              public_id: imageName,
              resource_type: 'image',
            },
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error) {
                reject(error);
              } else {
                resolve(result!);
              }
            },
          )
          .end(file.buffer);
      });

      this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async downloadImage(publicId: string): Promise<string> {
    this.logger.log(`Generating download URL for image: ${publicId}`);

    try {
      const url = cloudinary.url(publicId, {
        secure: true,
      });

      this.logger.log(`Download URL generated: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async removeFile(publicId: string): Promise<boolean> {
    this.logger.log(`Deleting image from Cloudinary: ${publicId}`);

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });

      if (result.result === 'ok' || result.result === 'not found') {
        this.logger.log(`File deleted successfully: ${publicId}`);
        return true;
      } else {
        this.logger.error(`Failed to delete file: ${JSON.stringify(result)}`);
        throw new Error(`Failed to delete file: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }
}
