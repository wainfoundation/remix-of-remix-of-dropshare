-- Add cover_url column to profiles table for profile cover images
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.cover_url IS 'URL to the user profile cover image';