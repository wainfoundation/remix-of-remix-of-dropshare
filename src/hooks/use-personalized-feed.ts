import { useState, useEffect } from 'react';
import { useFeedAlgorithm } from '@/hooks/use-feed-algorithm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ContentItem {
  id: string;
  type: 'post' | 'reel' | 'story';
  user_id: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  algorithm_score?: number;
}

export function usePersonalizedFeed() {
  const [feed, setFeed] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { getPersonalizedFeed, trackInteraction } = useFeedAlgorithm();

  useEffect(() => {
    if (user) {
      loadPersonalizedFeed();
    }
  }, [user]);

  const loadPersonalizedFeed = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch raw content from various sources
      const [postsData, reelsData] = await Promise.all([
        fetchPosts(),
        fetchReels()
      ]);

      // Combine and convert to ContentItem format
      const allContent: ContentItem[] = [
        ...postsData.map(post => ({
          id: post.id,
          type: 'post' as const,
          user_id: post.user_id,
          created_at: post.created_at,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          shares_count: post.shares?.length || 0
        })),
        ...reelsData.map(reel => ({
          id: reel.id,
          type: 'reel' as const,
          user_id: reel.user_id,
          created_at: reel.created_at,
          likes_count: reel.likes?.length || 0,
          comments_count: reel.comments?.length || 0,
          shares_count: 0 // Reels don't have shares in our schema
        }))
      ];

      // Apply algorithm to personalize feed
      const personalizedFeed = await getPersonalizedFeed(user.id, allContent);
      setFeed(personalizedFeed);

    } catch (err) {
      console.error('Error loading personalized feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, display_name, avatar_url, account_type),
        likes:likes(count),
        comments:comments(count),
        shares:shares(count)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  };

  const fetchReels = async () => {
    const { data, error } = await supabase
      .from('reels')
      .select(`
        *,
        profiles:user_id(username, display_name, avatar_url),
        likes:reel_likes(count),
        comments:reel_comments(count)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  };

  const handleContentView = (contentId: string, contentType: 'post' | 'reel') => {
    if (user) {
      trackInteraction({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        interaction_type: 'view'
      });
    }
  };

  const handleContentLike = (contentId: string, contentType: 'post' | 'reel') => {
    if (user) {
      trackInteraction({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        interaction_type: 'like'
      });
    }
  };

  const handleContentShare = (contentId: string, contentType: 'post' | 'reel') => {
    if (user) {
      trackInteraction({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        interaction_type: 'share'
      });
    }
  };

  const refreshFeed = () => {
    loadPersonalizedFeed();
  };

  return {
    feed,
    loading,
    error,
    handleContentView,
    handleContentLike,
    handleContentShare,
    refreshFeed
  };
}

// Hook for trending content specifically
export function useTrendingFeed() {
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getTrendingContent, updateTrending } = useFeedAlgorithm();

  useEffect(() => {
    loadTrendingContent();
    // Update trending hashtags
    updateTrending();
  }, []);

  const loadTrendingContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const trending = await getTrendingContent(20);
      setTrendingContent(trending);
    } catch (err) {
      console.error('Error loading trending content:', err);
      setError('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  return {
    trendingContent,
    loading,
    error,
    refreshTrending: loadTrendingContent
  };
}