# Supabase Storage Setup Guide

## Storage Configuration

Your Supabase storage is configured at:
- **Base URL**: `https://zgbzubmazzxjylgdpdqi.supabase.co`
- **Storage URL**: `https://zgbzubmazzxjylgdpdqi.supabase.co/storage/v1/object/public/uploads/`
- **Bucket**: `uploads` (public)

## Setup Steps

### 1. Run Storage Migration

Execute the migration in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the content from:
supabase/migrations/20260115_setup_storage.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 2. Verify Storage Bucket

1. Go to Supabase Dashboard → Storage
2. You should see an `uploads` bucket
3. Click on it and verify it's set to **Public**

### 3. Test Upload

The app now uses the storage helper at `src/lib/storage.ts` which:
- ✅ Validates files (size, type)
- ✅ Generates unique paths
- ✅ Handles uploads/downloads
- ✅ Provides error handling

## Usage Examples

### Upload a file

```typescript
import { uploadFile, generateFilePath } from '@/lib/storage';

// Generate unique path
const filePath = generateFilePath(userId, file.name, 'posts');

// Upload
const { url, error } = await uploadFile(file, filePath);

if (error) {
  console.error('Upload failed:', error);
} else {
  console.log('File uploaded:', url);
}
```

### Validate before upload

```typescript
import { validateFile } from '@/lib/storage';

const validation = validateFile(file, {
  maxSizeMB: 10,
  allowedTypes: ['image/*', 'video/*']
});

if (!validation.valid) {
  alert(validation.error);
}
```

## File Structure

Files are organized by type:
- `avatars/{userId}/{timestamp}-{random}.{ext}` - Profile pictures
- `posts/{userId}/{timestamp}-{random}.{ext}` - Post media
- `reels/{userId}/{timestamp}-{random}.{ext}` - Reel videos
- `stories/{userId}/{timestamp}-{random}.{ext}` - Story images
- `ads/{userId}/{timestamp}-{random}.{ext}` - Ad images

## Limits

Current file size limits:
- **Avatars**: 5 MB
- **Images**: 10 MB  
- **Posts/Videos**: 100 MB
- **Reels**: 200 MB

## Troubleshooting

### Upload fails with "Policy violation"

1. Check that storage migration was run
2. Verify bucket is public
3. Check Supabase dashboard for bucket policies

### Files not showing

1. Verify the URL format: `https://{project}.supabase.co/storage/v1/object/public/uploads/{path}`
2. Check browser console for CORS errors
3. Ensure bucket is set to public

### Large files failing

1. Check file size limits in storage helper
2. Adjust `maxSizeMB` parameter when validating
3. Consider implementing chunked uploads for very large files

## Security Notes

⚠️ **Important**: Since Pi Network auth doesn't use Supabase Auth:
- RLS policies allow all authenticated requests
- Security is enforced at application level
- Always validate user IDs in frontend before upload
- File paths include user ID for organization
- Consider adding server-side validation via Edge Functions
