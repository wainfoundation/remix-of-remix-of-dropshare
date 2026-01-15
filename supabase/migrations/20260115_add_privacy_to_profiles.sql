-- Add a new column 'privacy' to the profiles table
ALTER TABLE public.profiles
ADD COLUMN privacy text DEFAULT 'public' NOT NULL;