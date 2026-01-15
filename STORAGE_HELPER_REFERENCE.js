// ============================================
// STORAGE HELPER - QUICK REFERENCE
// ============================================

import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';

// ============================================
// 1. UPLOAD A FILE
// ============================================

const handleFileUpload = async (file: File, userId: string) => {
  // Validate first
  const validation = validateFile(file, {
    maxSizeMB: 10,
    allowedTypes: ['image/*', 'video/*']
  });
  
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
  
  // Generate unique path
  const filePath = generateFilePath(userId, file.name, 'posts');
  
  // Upload
  const { url, error } = await uploadFile(file, filePath);
  
  if (error) {
    console.error('Upload failed:', error);
    return;
  }
  
  console.log('File uploaded:', url);
  return url;
};

// ============================================
// 2. VALIDATION EXAMPLES
// ============================================

// Images only, max 5MB
validateFile(file, {
  maxSizeMB: 5,
  allowedTypes: ['image/*']
});

// Videos only, max 200MB
validateFile(file, {
  maxSizeMB: 200,
  allowedTypes: ['video/*']
});

// Images and videos, max 100MB
validateFile(file, {
  maxSizeMB: 100,
  allowedTypes: ['image/*', 'video/*']
});

// Specific types only
validateFile(file, {
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
});

// ============================================
// 3. FILE PATH EXAMPLES
// ============================================

// Avatar
generateFilePath('user123', 'photo.jpg', 'avatars');
// → avatars/user123/1705315200000-abc123.jpg

// Post
generateFilePath('user123', 'beach.jpg', 'posts');
// → posts/user123/1705315200000-def456.jpg

// Reel
generateFilePath('user123', 'dance.mp4', 'reels');
// → reels/user123/1705315200000-ghi789.mp4

// Story
generateFilePath('user123', 'sunset.jpg', 'stories');
// → stories/user123/1705315200000-jkl012.jpg

// ============================================
// 4. FULL UPLOAD EXAMPLE (with error handling)
// ============================================

const uploadWithFeedback = async (file: File, userId: string) => {
  try {
    // Step 1: Validate
    const validation = validateFile(file, {
      maxSizeMB: 100,
      allowedTypes: ['image/*', 'video/*']
    });
    
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }
    
    // Step 2: Generate path
    const filePath = generateFilePath(userId, file.name, 'posts');
    
    // Step 3: Upload
    const { url, error: uploadError } = await uploadFile(file, filePath);
    
    if (uploadError || !url) {
      throw uploadError || new Error('Upload failed');
    }
    
    // Step 4: Save to database
    await saveToDatabase(url);
    
    return { success: true, url };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error };
  }
};

// ============================================
// 5. COMMON PATTERNS
// ============================================

// Upload profile picture
const uploadAvatar = async (file: File, userId: string) => {
  const validation = validateFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/*']
  });
  
  if (!validation.valid) throw new Error(validation.error);
  
  const path = generateFilePath(userId, file.name, 'avatars');
  const { url, error } = await uploadFile(file, path);
  
  if (error) throw error;
  return url;
};

// Upload post media
const uploadPostMedia = async (file: File, userId: string) => {
  const validation = validateFile(file, {
    maxSizeMB: 100,
    allowedTypes: ['image/*', 'video/*']
  });
  
  if (!validation.valid) throw new Error(validation.error);
  
  const path = generateFilePath(userId, file.name, 'posts');
  const { url, error } = await uploadFile(file, path);
  
  if (error) throw error;
  return url;
};

// Upload reel
const uploadReel = async (file: File, userId: string) => {
  const validation = validateFile(file, {
    maxSizeMB: 200,
    allowedTypes: ['video/*']
  });
  
  if (!validation.valid) throw new Error(validation.error);
  
  const path = generateFilePath(userId, file.name, 'reels');
  const { url, error } = await uploadFile(file, path);
  
  if (error) throw error;
  return url;
};

// ============================================
// 6. ERROR HANDLING
// ============================================

// With toast notifications
const uploadWithToast = async (file: File, userId: string, toast: any) => {
  const validation = validateFile(file, {
    maxSizeMB: 10,
    allowedTypes: ['image/*']
  });
  
  if (!validation.valid) {
    toast({
      title: 'Invalid file',
      description: validation.error,
      variant: 'destructive'
    });
    return null;
  }
  
  const path = generateFilePath(userId, file.name, 'posts');
  const { url, error } = await uploadFile(file, path);
  
  if (error) {
    toast({
      title: 'Upload failed',
      description: error.message,
      variant: 'destructive'
    });
    return null;
  }
  
  toast({
    title: 'Success!',
    description: 'File uploaded successfully'
  });
  
  return url;
};

// ============================================
// 7. FILE SIZE LIMITS
// ============================================

const FILE_LIMITS = {
  avatar: 5,      // 5 MB
  image: 10,      // 10 MB
  video: 100,     // 100 MB
  reel: 200,      // 200 MB
  story: 10,      // 10 MB
  ad: 10          // 10 MB
};

// ============================================
// 8. ALLOWED FILE TYPES
// ============================================

const ALLOWED_TYPES = {
  images: ['image/*'],
  videos: ['video/*'],
  imagesAndVideos: ['image/*', 'video/*'],
  specificImages: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  specificVideos: ['video/mp4', 'video/quicktime', 'video/webm']
};

// ============================================
// 9. STORAGE URL FORMAT
// ============================================

// Public URL format:
// https://zgbzubmazzxjylgdpdqi.supabase.co/storage/v1/object/public/uploads/{path}

// Example:
// https://zgbzubmazzxjylgdpdqi.supabase.co/storage/v1/object/public/uploads/posts/user123/1705315200000-abc123.jpg

// ============================================
// 10. TROUBLESHOOTING
// ============================================

// Check if file is valid
const isValid = validateFile(file, { maxSizeMB: 10, allowedTypes: ['image/*'] });
console.log('Valid:', isValid.valid);
console.log('Error:', isValid.error);

// Generate path to see format
const path = generateFilePath('testUser', 'test.jpg', 'posts');
console.log('Path:', path);

// Test upload
const testUpload = async () => {
  const { url, error } = await uploadFile(file, path);
  console.log('URL:', url);
  console.log('Error:', error);
};
