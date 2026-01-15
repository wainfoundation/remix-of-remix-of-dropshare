CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_type AS ENUM (
    'business',
    'shopper',
    'creator'
);


--
-- Name: post_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_type AS ENUM (
    'text',
    'image',
    'video',
    'reel'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ad_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    user_id uuid,
    interaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ad_interactions_interaction_type_check CHECK ((interaction_type = ANY (ARRAY['impression'::text, 'click'::text, 'conversion'::text])))
);


--
-- Name: ad_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_id uuid NOT NULL,
    user_id uuid NOT NULL,
    payment_id text NOT NULL,
    amount_pi numeric(10,7) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    txid text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ad_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ad_type text DEFAULT 'feed'::text NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    video_url text,
    destination_url text,
    destination_type text DEFAULT 'external'::text,
    destination_id text,
    budget_pi numeric(10,7) DEFAULT 0 NOT NULL,
    spent_pi numeric(10,7) DEFAULT 0 NOT NULL,
    bid_type text DEFAULT 'cpm'::text NOT NULL,
    bid_amount_pi numeric(10,7) DEFAULT 0.0001 NOT NULL,
    target_audience jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    conversions integer DEFAULT 0 NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ads_ad_type_check CHECK ((ad_type = ANY (ARRAY['feed'::text, 'story'::text, 'reel'::text, 'explore'::text]))),
    CONSTRAINT ads_bid_type_check CHECK ((bid_type = ANY (ARRAY['cpm'::text, 'cpc'::text, 'cpa'::text]))),
    CONSTRAINT ads_destination_type_check CHECK ((destination_type = ANY (ARRAY['external'::text, 'profile'::text, 'post'::text, 'product'::text]))),
    CONSTRAINT ads_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'active'::text, 'paused'::text, 'completed'::text, 'rejected'::text])))
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    post_id uuid,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    actor_id uuid NOT NULL,
    post_id uuid,
    message text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['follow'::text, 'like'::text, 'comment'::text, 'follow_request'::text, 'message'::text])))
);


--
-- Name: post_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    media_url text NOT NULL,
    media_type text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT post_media_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])))
);


--
-- Name: post_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_url text,
    caption text,
    product_name text,
    price numeric(10,2),
    external_link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    post_type public.post_type DEFAULT 'image'::public.post_type NOT NULL,
    character_count integer
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    username text NOT NULL,
    display_name text NOT NULL,
    bio text,
    avatar_url text,
    account_type public.account_type DEFAULT 'shopper'::public.account_type NOT NULL,
    website_url text,
    store_category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reel_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reel_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reel_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reel_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reel_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reel_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    video_url text NOT NULL,
    thumbnail_url text,
    caption text,
    duration integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reels_duration_check CHECK ((duration <= 60))
);


--
-- Name: saved_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_url text NOT NULL,
    caption text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);


--
-- Name: story_highlight_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_highlight_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    highlight_id uuid NOT NULL,
    story_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: story_highlights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_highlights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    cover_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ad_interactions ad_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_interactions
    ADD CONSTRAINT ad_interactions_pkey PRIMARY KEY (id);


--
-- Name: ad_payments ad_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_payments
    ADD CONSTRAINT ad_payments_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: follows follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: likes likes_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_post_id_key UNIQUE (user_id, post_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- Name: post_views post_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_views
    ADD CONSTRAINT post_views_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: reel_comments reel_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reel_comments
    ADD CONSTRAINT reel_comments_pkey PRIMARY KEY (id);


--
-- Name: reel_likes reel_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reel_likes
    ADD CONSTRAINT reel_likes_pkey PRIMARY KEY (id);


--
-- Name: reel_likes reel_likes_user_id_reel_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reel_likes
    ADD CONSTRAINT reel_likes_user_id_reel_id_key UNIQUE (user_id, reel_id);


--
-- Name: reels reels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reels
    ADD CONSTRAINT reels_pkey PRIMARY KEY (id);


--
-- Name: saved_posts saved_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_pkey PRIMARY KEY (id);


--
-- Name: saved_posts saved_posts_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_user_id_post_id_key UNIQUE (user_id, post_id);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: story_highlight_items story_highlight_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_highlight_items
    ADD CONSTRAINT story_highlight_items_pkey PRIMARY KEY (id);


--
-- Name: story_highlights story_highlights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_highlights
    ADD CONSTRAINT story_highlights_pkey PRIMARY KEY (id);


--
-- Name: idx_ad_interactions_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_interactions_ad_id ON public.ad_interactions USING btree (ad_id);


--
-- Name: idx_ad_payments_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_payments_ad_id ON public.ad_payments USING btree (ad_id);


--
-- Name: idx_ads_ad_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_ad_type ON public.ads USING btree (ad_type);


--
-- Name: idx_ads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_status ON public.ads USING btree (status);


--
-- Name: idx_ads_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_user_id ON public.ads USING btree (user_id);


--
-- Name: idx_post_views_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_views_post_id ON public.post_views USING btree (post_id);


--
-- Name: idx_post_views_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_views_user_id ON public.post_views USING btree (user_id);


--
-- Name: idx_posts_post_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_post_type ON public.posts USING btree (post_type);


--
-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);


--
-- Name: idx_shares_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shares_post_id ON public.shares USING btree (post_id);


--
-- Name: idx_shares_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shares_user_id ON public.shares USING btree (user_id);


--
-- Name: ads update_ads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reels update_reels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON public.reels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_interactions ad_interactions_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_interactions
    ADD CONSTRAINT ad_interactions_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_payments ad_payments_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_payments
    ADD CONSTRAINT ad_payments_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: likes likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_media post_media_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_views post_views_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_views
    ADD CONSTRAINT post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reel_comments reel_comments_reel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reel_comments
    ADD CONSTRAINT reel_comments_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id) ON DELETE CASCADE;


--
-- Name: reel_likes reel_likes_reel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reel_likes
    ADD CONSTRAINT reel_likes_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id) ON DELETE CASCADE;


--
-- Name: saved_posts saved_posts_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: saved_posts saved_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: shares shares_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: stories stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: story_highlight_items story_highlight_items_highlight_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_highlight_items
    ADD CONSTRAINT story_highlight_items_highlight_id_fkey FOREIGN KEY (highlight_id) REFERENCES public.story_highlights(id) ON DELETE CASCADE;


--
-- Name: story_highlight_items story_highlight_items_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_highlight_items
    ADD CONSTRAINT story_highlight_items_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: story_highlights story_highlights_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_highlights
    ADD CONSTRAINT story_highlights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ad_interactions Ad owners can view interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ad owners can view interactions" ON public.ad_interactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ads
  WHERE ((ads.id = ad_interactions.ad_id) AND (ads.user_id = auth.uid())))));


--
-- Name: post_views Anyone can insert post views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert post views" ON public.post_views FOR INSERT WITH CHECK (true);


--
-- Name: ad_interactions Authenticated users can create ad interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create ad interactions" ON public.ad_interactions FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) OR (user_id IS NULL)));


--
-- Name: comments Comments are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);


--
-- Name: follows Follows are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);


--
-- Name: likes Likes are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);


--
-- Name: post_media Post media is viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Post media is viewable by everyone" ON public.post_media FOR SELECT USING (true);


--
-- Name: post_views Post views are viewable by post owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Post views are viewable by post owner" ON public.post_views FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_views.post_id) AND (posts.user_id = auth.uid())))));


--
-- Name: posts Posts are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);


--
-- Name: profiles Public profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: reel_comments Reel comments are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reel comments are viewable by everyone" ON public.reel_comments FOR SELECT USING (true);


--
-- Name: reel_likes Reel likes are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reel likes are viewable by everyone" ON public.reel_likes FOR SELECT USING (true);


--
-- Name: reels Reels are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reels are viewable by everyone" ON public.reels FOR SELECT USING (true);


--
-- Name: shares Shares are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Shares are viewable by everyone" ON public.shares FOR SELECT USING (true);


--
-- Name: stories Stories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (true);


--
-- Name: story_highlight_items Story highlight items are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Story highlight items are viewable by everyone" ON public.story_highlight_items FOR SELECT USING (true);


--
-- Name: story_highlights Story highlights are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Story highlights are viewable by everyone" ON public.story_highlights FOR SELECT USING (true);


--
-- Name: ads Users can create their own ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own ads" ON public.ads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ad_payments Users can create their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own payments" ON public.ad_payments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ads Users can delete their own ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own ads" ON public.ads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: follows Users can delete their own follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: likes Users can delete their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_media Users can delete their own post media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own post media" ON public.post_media FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_media.post_id) AND (posts.user_id = auth.uid())))));


--
-- Name: posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reel_comments Users can delete their own reel comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reel comments" ON public.reel_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reel_likes Users can delete their own reel likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reel likes" ON public.reel_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reels Users can delete their own reels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reels" ON public.reels FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_posts Users can delete their own saved posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own saved posts" ON public.saved_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: shares Users can delete their own shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own shares" ON public.shares FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: stories Users can delete their own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: story_highlight_items Users can delete their own story highlight items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own story highlight items" ON public.story_highlight_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.story_highlights
  WHERE ((story_highlights.id = story_highlight_items.highlight_id) AND (story_highlights.user_id = auth.uid())))));


--
-- Name: story_highlights Users can delete their own story highlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own story highlights" ON public.story_highlights FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: conversation_participants Users can insert conversation participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert conversation participants" ON public.conversation_participants FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversations Users can insert conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: messages Users can insert messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages in their conversations" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = messages.conversation_id) AND (conversation_participants.user_id = auth.uid()))))));


--
-- Name: notifications Users can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((auth.uid() = actor_id));


--
-- Name: comments Users can insert their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: follows Users can insert their own follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own follows" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: likes Users can insert their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_media Users can insert their own post media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own post media" ON public.post_media FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_media.post_id) AND (posts.user_id = auth.uid())))));


--
-- Name: posts Users can insert their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reel_comments Users can insert their own reel comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reel comments" ON public.reel_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reel_likes Users can insert their own reel likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reel likes" ON public.reel_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reels Users can insert their own reels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reels" ON public.reels FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_posts Users can insert their own saved posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own saved posts" ON public.saved_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: shares Users can insert their own shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own shares" ON public.shares FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: stories Users can insert their own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own stories" ON public.stories FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: story_highlight_items Users can insert their own story highlight items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own story highlight items" ON public.story_highlight_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.story_highlights
  WHERE ((story_highlights.id = story_highlight_items.highlight_id) AND (story_highlights.user_id = auth.uid())))));


--
-- Name: story_highlights Users can insert their own story highlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own story highlights" ON public.story_highlights FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ads Users can update their own ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own ads" ON public.ads FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can update their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING ((auth.uid() = sender_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: posts Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: reels Users can update their own reels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reels" ON public.reels FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: story_highlights Users can update their own story highlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own story highlights" ON public.story_highlights FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ads Users can view active ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active ads" ON public.ads FOR SELECT USING (((status = 'active'::text) OR (auth.uid() = user_id)));


--
-- Name: conversation_participants Users can view conversations they are part of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view conversations they are part of" ON public.conversation_participants FOR SELECT USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE ((cp.conversation_id = cp.conversation_id) AND (cp.user_id = auth.uid()))))));


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = messages.conversation_id) AND (conversation_participants.user_id = auth.uid())))));


--
-- Name: conversations Users can view their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = conversation_participants.id) AND (conversation_participants.user_id = auth.uid())))));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ad_payments Users can view their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own payments" ON public.ad_payments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_posts Users can view their own saved posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own saved posts" ON public.saved_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ad_interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

--
-- Name: likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: post_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

--
-- Name: post_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reel_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: reel_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: reels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: shares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

--
-- Name: stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

--
-- Name: story_highlight_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

--
-- Name: story_highlights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;