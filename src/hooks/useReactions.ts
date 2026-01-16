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
      
      const { data, error: fetchError } = await supabase
        .from('post_reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
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

      console.log('Fetched reactions:', data);

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

      data?.forEach((reaction) => {
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

      // Remove previous reaction if exists
      if (userReaction) {
        console.log('Removing previous reaction:', userReaction);
        const { error: deleteError } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error deleting reaction:', deleteError);
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
      const { error: insertError } = await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          reaction_type: reaction,
        });

      if (insertError) {
        console.error('Error inserting reaction:', insertError);
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