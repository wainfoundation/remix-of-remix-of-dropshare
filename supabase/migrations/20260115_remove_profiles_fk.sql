-- Remove foreign key constraint that ties profiles.user_id to auth.users.id
-- This allows Pi-only authentication without Supabase Auth user records.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Optional: Make user_id a text column if not already (skip if already text)
-- Uncomment if needed after checking schema
-- ALTER TABLE public.profiles ALTER COLUMN user_id TYPE text;

-- Note: Run this in Supabase SQL editor, or via `supabase db push` in CI.
