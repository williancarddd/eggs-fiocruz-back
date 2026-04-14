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
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || '';
    this.apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') || '';

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
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

  createSignedUploadParams({
    folder,
    publicId,
    contentType,
  }: {
    folder: string;
    publicId: string;
    contentType: string;
  }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const allowedFormats = this.getAllowedFormatsByMime(contentType).join(',');
    const paramsToSign = {
      folder,
      public_id: publicId,
      timestamp,
      resource_type: 'image',
      allowed_formats: allowedFormats,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType: 'image',
      allowedFormats,
    };
  }

  private getAllowedFormatsByMime(contentType: string): string[] {
    if (contentType === 'image/png') {
      return ['png'];
    }

    if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
      return ['jpg', 'jpeg'];
    }

    return ['jpg', 'jpeg', 'png'];
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
