import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to Supabase storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., 'avatars/user123/image.jpg')
 * @param bucket - The storage bucket name (default: 'uploads')
 * @returns The public URL of the uploaded file or null if failed
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = 'uploads'
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Delete a file from Supabase storage
 * @param path - The storage path to delete
 * @param bucket - The storage bucket name (default: 'uploads')
 */
export async function deleteFile(
  path: string,
  bucket: string = 'uploads'
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Delete error:', error);
    return { error: error as Error };
  }
}

/**
 * Generate a unique file path for upload
 * @param userId - The user ID
 * @param fileName - The original file name
 * @param folder - The folder name (e.g., 'avatars', 'posts', 'reels')
 * @returns A unique file path
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  folder: string = 'uploads'
): string {
  const timestamp = Date.now();
  const fileExt = fileName.split('.').pop();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${folder}/${userId}/${timestamp}-${randomStr}.${fileExt}`;
}

/**
 * Extract the storage path from a public URL
 * @param url - The public URL
 * @returns The storage path or null
 */
export function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Extract path after /storage/v1/object/public/bucket-name/
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validate file size and type
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error: string | null } {
  const { maxSizeMB = 50, allowedTypes = [] } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0) {
    const fileType = file.type;
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${fileType} is not allowed`,
      };
    }
  }

  return { valid: true, error: null };
}
