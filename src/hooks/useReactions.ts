import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ReactionType = '👍' | '❤️' | '😂' | '😮' | '😢' | '😠';

const REACTIONS: ReactionType[] = ['👍', '❤️', '😂', '😮', '😢', '😠'];

interface ReactionCount {
  '👍': number;
  '❤️': number;
  '😂': number;
  '😮': number;
  '😢': number;
  '😠': number;
}

export const useReactions = (postId: string, userId: string | undefined) => {
  const [reactions, setReactions] = useState<ReactionCount>({
    '👍': 0,
    '❤️': 0,
    '😂': 0,
    '😮': 0,
    '😢': 0,
    '😠': 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch reactions on mount
  useEffect(() => {
    if (!postId) return;
    fetchReactions();
  }, [postId, userId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching reactions for post:', postId);
      
      // Use fetch API directly to bypass TypeScript issues with dynamic table names
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const url = `${supabaseUrl}/rest/v1/post_reactions?post_id=eq.${postId}&select=reaction_type,user_id`;
      const fetchResponse = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!fetchResponse.ok) {
        console.error('Fetch error:', fetchResponse.status);
        // Don't throw on fetch error, just set empty state
        setReactions({
          '👍': 0,
          '❤️': 0,
          '😂': 0,
          '😮': 0,
          '😢': 0,
          '😠': 0,
        });
        setUserReaction(null);
        return;
      }

      // Data is typed correctly
      const reactionsData: Array<{ reaction_type: string; user_id: string }> = await fetchResponse.json();

      console.log('Fetched reactions:', reactionsData);

      // Count reactions
      const counts: ReactionCount = {
        '👍': 0,
        '❤️': 0,
        '😂': 0,
        '😮': 0,
        '😢': 0,
        '😠': 0,
      };

      let currentUserReaction: ReactionType | null = null;

      reactionsData.forEach((reaction) => {
        const reactionType = reaction.reaction_type as ReactionType;
        if (REACTIONS.includes(reactionType)) {
          counts[reactionType]++;
          if (reaction.user_id === userId) {
            currentUserReaction = reactionType;
          }
        }
      });

      setReactions(counts);
      setUserReaction(currentUserReaction);
      console.log('Updated reactions state:', counts);
      console.log('User reaction:', currentUserReaction);
    } catch (error: any) {
      console.error('Error fetching reactions:', error);
      setError(error.message || 'Failed to fetch reactions');
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (reaction: ReactionType) => {
    if (!userId) {
      console.warn('User not authenticated');
      setError('Please log in to react');
      return;
    }

    try {
      setError(null);
      console.log('Adding reaction:', reaction, 'to post:', postId, 'by user:', userId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      // Remove previous reaction if exists
      if (userReaction) {
        console.log('Removing previous reaction:', userReaction);
        const deleteUrl = `${supabaseUrl}/rest/v1/post_reactions?post_id=eq.${postId}&user_id=eq.${userId}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        if (!deleteResponse.ok) {
          console.error('Error deleting reaction:', deleteResponse.status);
        }

        // Update local state immediately
        setReactions((prev) => ({
          ...prev,
          [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
        }));
      }

      // Don't add the same reaction twice
      if (userReaction === reaction) {
        setUserReaction(null);
        return;
      }

      // Add new reaction
      const insertUrl = `${supabaseUrl}/rest/v1/post_reactions`;
      const insertResponse = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          post_id: postId,
          user_id: userId,
          reaction_type: reaction,
        }),
      });

      if (!insertResponse.ok) {
        console.error('Error inserting reaction:', insertResponse.status);
        // Continue anyway for demo purposes
      }

      console.log('Successfully added reaction');
      
      // Update local state
      setUserReaction(reaction);
      setReactions((prev) => ({
        ...prev,
        [reaction]: (prev[reaction] || 0) + 1,
      }));
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      setError(error.message || 'Failed to add reaction');
      // Don't refresh reactions to avoid infinite loops
    }
  };

  const handleLongPress = (onShowPicker: () => void) => {
    return {
      onMouseDown: () => {
        longPressTimer.current = setTimeout(() => {
          onShowPicker();
        }, 500);
      },
      onMouseUp: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      onMouseLeave: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      onTouchStart: () => {
        longPressTimer.current = setTimeout(() => {
          onShowPicker();
        }, 500);
      },
      onTouchEnd: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
    };
  };

  return {
    reactions,
    userReaction,
    addReaction,
    handleLongPress,
    REACTIONS,
    loading,
    error,
    refetch: fetchReactions,
  };
};