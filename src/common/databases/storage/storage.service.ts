import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly region: string;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || '';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';
    this.publicBaseUrl =
      this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL') ||
      `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region: this.region,
    });

    this.logger.log('S3 client initialized successfully');
  }

  async uploadImage({
    file,
    userId,
    processExecutionId,
  }: {
    file: Express.Multer.File;
    userId: string;
    processExecutionId: string;
  }): Promise<{ key: string; url: string }> {
    const timestamp = new Date().getTime();
    const originalExt = file.originalname.split('.').pop();
    const imageName = `${processExecutionId}_${timestamp}.${originalExt || 'jpg'}`;
    const objectKey = `${userId}/${imageName}`;

    this.logger.log(`Uploading image to S3: key=${objectKey}`);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
        }),
      );

      const url = this.getPublicUrl(objectKey);
      this.logger.log(`Image uploaded successfully: ${url}`);

      return {
        key: objectKey,
        url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async createPresignedUploadParams({
    objectKey,
    contentType,
  }: {
    objectKey: string;
    contentType: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 120,
    });

    return {
      uploadUrl,
      objectKey,
      publicUrl: this.getPublicUrl(objectKey),
      contentType,
    };
  }

  getPublicUrl(objectKey: string): string {
    const normalizedBase = this.publicBaseUrl.endsWith('/')
      ? this.publicBaseUrl.slice(0, -1)
      : this.publicBaseUrl;
    const encodedKey = objectKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${normalizedBase}/${encodedKey}`;
  }

  isTrustedObjectUrl(url: string): boolean {
    const normalizedBase = this.publicBaseUrl.endsWith('/')
      ? this.publicBaseUrl.slice(0, -1)
      : this.publicBaseUrl;
    return url.startsWith(`${normalizedBase}/`);
  }

  extractObjectKeyFromUrl(urlOrKey: string): string {
    if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
      return urlOrKey;
    }

    const normalizedBase = this.publicBaseUrl.endsWith('/')
      ? this.publicBaseUrl.slice(0, -1)
      : this.publicBaseUrl;

    if (urlOrKey.startsWith(`${normalizedBase}/`)) {
      return decodeURIComponent(urlOrKey.slice(normalizedBase.length + 1));
    }

    const parsed = new URL(urlOrKey);
    const objectKey = parsed.pathname.startsWith('/')
      ? parsed.pathname.slice(1)
      : parsed.pathname;
    return decodeURIComponent(objectKey);
  }

  async downloadImage(objectKey: string): Promise<string> {
    this.logger.log(`Generating image URL for key: ${objectKey}`);

    try {
      const url = this.getPublicUrl(objectKey);
      this.logger.log(`Image URL generated: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate image URL: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async removeFile(publicIdOrUrl: string): Promise<boolean> {
    const objectKey = this.extractObjectKeyFromUrl(publicIdOrUrl);
    this.logger.log(`Deleting image from S3: key=${objectKey}`);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );

      this.logger.log(`File deleted successfully: ${objectKey}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete image: ${
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
    const objectKey = `${folder}/${publicId}`;
    return this.createPresignedUploadParams({
      objectKey,
      contentType,
    });
  }
}
