import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<any, "public", any>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseKey = process.env.SUPABASE_KEY as string;
    this.supabase = createClient(supabaseUrl, supabaseKey);

  }

  async uploadImage(file: Express.Multer.File, userId: string, processId: string) {
    const supabase = this.getClient();
    const imageName = `${file.originalname.split('.')[0]}-${processId}`;
    const filePath = `${userId}/${imageName}`;
    const { data, error } = await supabase.storage
      .from(
        'eggs-palet-images'
      )
      .upload(filePath, file.buffer, { 
        upsert: true,
        contentType: file.mimetype,
      });
    const { data: urlData } =
      await supabase.storage
        .from('eggs-palet-images')
        .getPublicUrl(
          filePath
        )
    if (error) {
      throw new Error(`Error uploading file: ${error.message}`)
    }

    return {
      ...data,
      ...urlData
    }
  }


  async downloadImage(filePath: string) {
    const supabase = this.getClient();
    // replace in  https://blallbla/daldladla/eggs-palet-images/interest/interest-1

    const preparedFilePath = filePath.split('eggs-palet-images/')[1];
    const { data, error } = await supabase.storage
      .from('eggs-palet-images')
      .download(preparedFilePath);

    if (error) {
      throw new Error(`Error downloading file: ${error}`)
    }

    return data;
  }

  getClient() {
    return this.supabase;
  }
}
