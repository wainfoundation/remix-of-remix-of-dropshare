-- Fix RLS for hashtags/post_hashtags for Pi-only auth
-- Allows inserts/selects without relying on auth.uid()

-- Hashtags
DROP POLICY IF EXISTS "Hashtags insert" ON public.hashtags;
DROP POLICY IF EXISTS "Hashtags select" ON public.hashtags;
CREATE POLICY "Hashtags insert" ON public.hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Hashtags select" ON public.hashtags FOR SELECT USING (true);

-- Post hashtags join table
DROP POLICY IF EXISTS "Post hashtags insert" ON public.post_hashtags;
DROP POLICY IF EXISTS "Post hashtags select" ON public.post_hashtags;
CREATE POLICY "Post hashtags insert" ON public.post_hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Post hashtags select" ON public.post_hashtags FOR SELECT USING (true);
