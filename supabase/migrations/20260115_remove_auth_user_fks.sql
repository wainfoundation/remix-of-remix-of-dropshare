-- Remove foreign key constraints to auth.users for Pi-only auth flows

alter table if exists public.posts drop constraint if exists posts_user_id_fkey;
alter table if exists public.comments drop constraint if exists comments_user_id_fkey;
alter table if exists public.likes drop constraint if exists likes_user_id_fkey;
alter table if exists public.follows drop constraint if exists follows_follower_id_fkey;
alter table if exists public.follows drop constraint if exists follows_following_id_fkey;
alter table if exists public.messages drop constraint if exists messages_sender_id_fkey;
alter table if exists public.conversation_participants drop constraint if exists conversation_participants_user_id_fkey;
alter table if exists public.saved_posts drop constraint if exists saved_posts_user_id_fkey;
alter table if exists public.stories drop constraint if exists stories_user_id_fkey;
alter table if exists public.story_highlights drop constraint if exists story_highlights_user_id_fkey;
alter table if exists public.profiles drop constraint if exists profiles_user_id_fkey;

-- Optional: ensure no check constraints block inserts (kept minimal here)
