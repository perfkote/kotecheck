import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucoblvwltepskuudnzvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb2JsdndsdGVwc2t1dWRuenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNzQ0OTIsImV4cCI6MjA4MTk1MDQ5Mn0.KYtFqnuFKMMWapWRmt4lHKVdB-RBGyArw033KUQMo8g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = 'jobs';

/**
 * Upload a photo to Supabase Storage under the job's folder.
 * Path: jobs/{jobId}/{timestamp}_{filename}
 */
export async function uploadJobPhoto(jobId: string, file: File): Promise<{ path: string; url: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${jobId}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Delete a photo from Supabase Storage.
 */
export async function deleteJobPhoto(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get the public URL for a photo.
 */
export function getJobPhotoUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
