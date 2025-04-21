import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<any, 'public', any>;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly BUCKET_NAME = 'eggs-palet-images';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseKey = process.env.SUPABASE_KEY as string;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase configuration missing. Check SUPABASE_URL and SUPABASE_KEY environment variables.',
      );
      throw new Error('Supabase configuration missing');
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully');
      this.initializeStorage();
    } catch (error) {
      this.logger.error(
        `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async initializeStorage() {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      // const bucketExists = buckets?.some(
      //   (bucket) => bucket.name === this.BUCKET_NAME,
      // );

      // // if (!bucketExists) {
      // //   const { error } = await this.supabase.storage.createBucket(
      // //     this.BUCKET_NAME,
      // //     {
      // //       public: true,
      // //       allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      // //       fileSizeLimit: 5242880, // 5MB
      // //     },
      // //   );

      // //   if (error) {
      // //     this.logger.error(
      // //       `Failed to create storage bucket: ${error.message}`,
      // //     );
      // //     throw error;
      // //   }

      // //   this.logger.log(
      // //     `Storage bucket '${this.BUCKET_NAME}' created successfully`,
      // //   );
      // // } else {
      // //   this.logger.log(`Storage bucket '${this.BUCKET_NAME}' already exists`);
      // // }
    } catch (error) {
      this.logger.error(
        `Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async uploadImage({
    file,
    userId,
    processExecutionId,
  }: {
    file: Express.Multer.File;
    userId: string;
    processExecutionId: string;
  }) {
    const supabase = this.getClient();
    const imageName = `${processExecutionId}`;
    const filePath = `${userId}/${imageName}`;

    this.logger.log(
      `Attempting to upload image for user ${userId}, process ${processExecutionId}`,
    );

    try {
      const { data, error } = await supabase.storage
        .from('eggs-palet-images')
        .upload(filePath, file.buffer, {
          upsert: true,
          contentType: file.mimetype,
        });

      if (error) {
        this.logger.error(`Failed to upload image: ${error.message}`);
        throw new Error(`Error uploading file: ${error.message}`);
      }

      const { data: urlData } = await supabase.storage
        .from('eggs-palet-images')
        .getPublicUrl(filePath);

      this.logger.log(`Successfully uploaded image to ${filePath}`);

      return {
        ...data,
        ...urlData,
      };
    } catch (error) {
      this.logger.error(
        `Unexpected error during upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async downloadImage(filePath: string) {
    const supabase = this.getClient();
    const preparedFilePath = filePath.split('eggs-palet-images/')[1];

    this.logger.log(`Attempting to download image: ${preparedFilePath}`);

    try {
      const { data, error } = await supabase.storage
        .from('eggs-palet-images')
        .download(preparedFilePath);

      if (error) {
        this.logger.error(`Failed to download image: ${error.message}`);
        throw new Error(`Error downloading file: ${error}`);
      }

      this.logger.log(`Successfully downloaded image: ${preparedFilePath}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Unexpected error during download: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async removeFile(filePath: string) {
    const supabase = this.getClient();
    const preparedFilePath = filePath.split('eggs-palet-images/')[1];

    this.logger.log(`Attempting to remove file: ${preparedFilePath}`);

    try {
      const { error } = await supabase.storage
        .from('eggs-palet-images')
        .remove([preparedFilePath]);

      if (error) {
        this.logger.error(`Failed to remove file: ${error.message}`);
        throw new Error(`Error removing file: ${error.message}`);
      }

      this.logger.log(`Successfully removed file: ${preparedFilePath}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Unexpected error during file removal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  getClient() {
    return this.supabase;
  }
}
