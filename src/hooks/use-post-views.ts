import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTrackPostView(postId: string | undefined) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!postId || tracked.current) return;

    const trackView = async () => {
      try {
        await supabase.from('post_views').insert({
          post_id: postId,
          user_id: user?.id || null,
        });
        tracked.current = true;
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.warn('Failed to track view:', error);
      }
    };

    // Delay tracking to ensure actual view (not just scrolling past)
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [postId, user?.id]);
}

export function useTrackShare(postId: string) {
  const { user } = useAuth();

  const trackShare = async () => {
    if (!user) return false;

    try {
      await supabase.from('shares').insert({
        post_id: postId,
        user_id: user.id,
      });
      return true;
    } catch (error) {
      console.warn('Failed to track share:', error);
      return false;
    }
  };

  return { trackShare };
}