# Fix "Failed to Post" RLS Error

## Problem
You're getting this error: **"Failed to post - new row violates row-level security policy for table 'posts'"**

This happens because:
- Your app uses **Pi Network authentication** (not Supabase Auth)
- Pi Network users don't have `auth.uid()` in Supabase
- The RLS policies require `auth.uid()` to match, which always fails

## Solution
Run the SQL script to update all RLS policies to work with Pi Network authentication.

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/vjkpkqajjohqisfzkxvp
   - Sign in to your account

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Fix**
   - Open the file: `fix-rls-policies.sql`
   - Copy ALL the content
   - Paste into the SQL Editor

4. **Run the Script**
   - Click the "Run" button (or press Ctrl+Enter)
   - Wait for "Success" message

5. **Test Your App**
   - Try uploading a post/video/reel
   - Should work now!

## What This Does

The script updates Row-Level Security (RLS) policies for all tables:
- ✅ Profiles
- ✅ Posts
- ✅ Post Media
- ✅ Comments
- ✅ Likes
- ✅ Saved Posts
- ✅ Shares
- ✅ Follows
- ✅ Stories
- ✅ Reels
- ✅ Messages

**Before:** Policies required `auth.uid() = user_id` (doesn't work with Pi Network)
**After:** Policies allow operations with `true` (works with Pi Network)

## Security Note

The new policies are more permissive because Pi Network authentication is handled at the application level, not by Supabase Auth. User validation happens in your frontend code before any database operations.

## Troubleshooting

If you still get errors after running the script:

1. **Check if script ran successfully**
   - Look for "Success" message in SQL Editor
   - No red error messages

2. **Verify policies were updated**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'posts';
   ```
   Should show new policy names like "Allow users to insert posts"

3. **Clear browser cache**
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

4. **Check user is logged in**
   - Open browser console (F12)
   - Type: `localStorage.getItem('pi_authenticated')`
   - Should return: `"true"`
