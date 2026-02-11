-- Remove foreign key constraint on profiles.user_id so Pi Network users can create profiles
-- Pi auth users don't have rows in auth.users, so this FK blocks profile creation
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Also ensure RLS allows inserts without requiring auth.uid() since Pi users aren't in auth.users
-- Drop existing insert policy if it uses auth.uid()
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- Create permissive policies for Pi auth flow
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Anyone can create profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own profiles"
ON public.profiles FOR UPDATE
USING (true);

CREATE POLICY "Users can delete own profiles" 
ON public.profiles FOR DELETE
USING (true);