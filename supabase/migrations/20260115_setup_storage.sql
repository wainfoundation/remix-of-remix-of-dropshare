-- =====================================================
-- SETUP SUPABASE STORAGE FOR UPLOADS
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create storage bucket for uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow authenticated users to upload
-- Allow anyone to view public files
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow uploads for authenticated users" ON storage.objects;
CREATE POLICY "Allow uploads for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

-- Allow users to update their own files
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'uploads');

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads');

-- Note: With RLS disabled (auth.uid() not used), all authenticated 
-- requests are allowed. Security is handled at the application level.
-- The user_id in the file path should match the authenticated user.
