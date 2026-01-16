import React, { useState, useEffect } from 'react';
import { useReactions, ReactionType } from '../hooks/useReactions';
import { ReactionPicker } from './ReactionPicker';
import { ReactionBubble } from './ReactionBubble';

interface PostActionsProps {
  postId: string;
  userId: string | undefined;
  onComment?: () => void;
  onShare?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  postId,
  userId,
  onComment,
  onShare,
}) => {
  const { reactions, userReaction, addReaction, handleLongPress, loading, error } =
    useReactions(postId, userId);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

  const handleReactionButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) {
      alert('Please log in to react to posts');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setPickerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setPickerVisible(!pickerVisible);
  };

  const handleReactionSelect = (reaction: ReactionType) => {
    addReaction(reaction);
    setPickerVisible(false);
  };

  const showPicker = () => {
    if (!userId) {
      alert('Please log in to react to posts');
      return;
    }
    setPickerVisible(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
        Loading reactions...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb' }}>
      {/* Reaction Picker */}
      <ReactionPicker
        isVisible={pickerVisible}
        position={pickerPosition}
        onSelect={handleReactionSelect}
        onClose={() => setPickerVisible(false)}
      />

      {/* Reaction Display */}
      <div style={{ padding: '8px 0', minHeight: '32px' }}>
        <ReactionBubble
          reactions={reactions}
          userReaction={userReaction}
          onClick={() => setPickerVisible(!pickerVisible)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '4px 0', color: '#ef4444', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '4px', paddingTop: '8px' }}>
        {/* Like/Reaction Button */}
        <button
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            border: 'none',
            borderRadius: '8px',
            background: userReaction ? '#fee2e2' : 'transparent',
            color: userReaction ? '#ef4444' : '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          }}
          {...handleLongPress(showPicker)}
          onClick={handleReactionButtonClick}
          onMouseEnter={(e) => {
            if (!userReaction) {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#4b5563';
            }
          }}
          onMouseLeave={(e) => {
            if (!userReaction) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }
          }}
        >
          <span style={{ fontSize: '18px' }}>
            {userReaction || '👍'}
          </span>
          <span style={{ fontSize: '13px' }}>React</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onComment}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            border: 'none',
            borderRadius: '8px',
            background: 'transparent',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <span style={{ fontSize: '18px' }}>💬</span>
          <span style={{ fontSize: '13px' }}>Comment</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            border: 'none',
            borderRadius: '8px',
            background: 'transparent',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <span style={{ fontSize: '18px' }}>↗️</span>
          <span style={{ fontSize: '13px' }}>Share</span>
        </button>
      </div>
    </div>
  );
};