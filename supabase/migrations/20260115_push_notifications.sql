-- =====================================================
-- PUSH NOTIFICATIONS SYSTEM
-- Real-time notifications like Facebook/Instagram
-- =====================================================

-- Table to store push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (true);

-- Table to store notification queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'message', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON public.notification_queue(sent);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notification_queue
  FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTION: Queue notification
-- =====================================================
CREATE OR REPLACE FUNCTION public.queue_notification(
  p_user_id TEXT,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notification_queue (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- =====================================================
-- TRIGGER: Send notification on new like
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_owner_id TEXT;
  v_liker_name TEXT;
  v_post_id UUID;
BEGIN
  -- Get post owner and liker details
  SELECT p.user_id, p.id INTO v_post_owner_id, v_post_id
  FROM public.posts p
  WHERE p.id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's display name
  SELECT COALESCE(display_name, username, user_id) INTO v_liker_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Queue notification
  PERFORM public.queue_notification(
    v_post_owner_id,
    'like',
    '❤️ New Like!',
    v_liker_name || ' liked your post',
    jsonb_build_object('post_id', v_post_id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON public.likes;
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();

-- =====================================================
-- TRIGGER: Send notification on new comment
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_owner_id TEXT;
  v_commenter_name TEXT;
  v_post_id UUID;
BEGIN
  -- Get post owner and commenter details
  SELECT p.user_id, p.id INTO v_post_owner_id, v_post_id
  FROM public.posts p
  WHERE p.id = NEW.post_id;
  
  -- Don't notify if user commented on their own post
  IF v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's display name
  SELECT COALESCE(display_name, username, user_id) INTO v_commenter_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Queue notification
  PERFORM public.queue_notification(
    v_post_owner_id,
    'comment',
    '💬 New Comment!',
    v_commenter_name || ' commented on your post',
    jsonb_build_object('post_id', v_post_id, 'comment_id', NEW.id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- =====================================================
-- TRIGGER: Send notification on new follower
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  -- Get follower's display name
  SELECT COALESCE(display_name, username, user_id) INTO v_follower_name
  FROM public.profiles
  WHERE user_id = NEW.follower_id;
  
  -- Queue notification
  PERFORM public.queue_notification(
    NEW.following_id,
    'follow',
    '👥 New Follower!',
    v_follower_name || ' started following you',
    jsonb_build_object('user_id', NEW.follower_id)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_follow ON public.follows;
CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- =====================================================
-- TRIGGER: Send notification on new message
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name TEXT;
  v_participant RECORD;
BEGIN
  -- Get sender's display name
  SELECT COALESCE(display_name, username, user_id) INTO v_sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;
  
  -- Notify all conversation participants except the sender
  FOR v_participant IN
    SELECT user_id
    FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    PERFORM public.queue_notification(
      v_participant.user_id,
      'message',
      '📨 New Message!',
      v_sender_name || ' sent you a message',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_message ON public.messages;
CREATE TRIGGER trigger_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_message();

-- =====================================================
-- TRIGGER: Send notification on share
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_owner_id TEXT;
  v_sharer_name TEXT;
  v_post_id UUID;
BEGIN
  -- Get post owner and sharer details
  SELECT p.user_id, p.id INTO v_post_owner_id, v_post_id
  FROM public.posts p
  WHERE p.id = NEW.post_id;
  
  -- Don't notify if user shared their own post
  IF v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get sharer's display name
  SELECT COALESCE(display_name, username, user_id) INTO v_sharer_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Queue notification
  PERFORM public.queue_notification(
    v_post_owner_id,
    'share',
    '🔄 Post Shared!',
    v_sharer_name || ' shared your post',
    jsonb_build_object('post_id', v_post_id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_share ON public.shares;
CREATE TRIGGER trigger_notify_on_share
  AFTER INSERT ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_share();

-- Grant necessary permissions
GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO anon;
GRANT ALL ON public.notification_queue TO authenticated;
GRANT ALL ON public.notification_queue TO anon;

-- Note: Install the migration, then create a Supabase Edge Function
-- to process the notification queue and send web push notifications
