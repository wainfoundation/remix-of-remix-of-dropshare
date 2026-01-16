import React from 'react';
import { ReactionType } from '../hooks/useReactions';

interface ReactionBubbleProps {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  onClick?: () => void;
}

export const ReactionBubble: React.FC<ReactionBubbleProps> = ({
  reactions,
  userReaction,
  onClick,
}) => {
  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
  const displayReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .slice(0, 3);

  if (totalReactions === 0) return null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#f3f4f6',
        borderRadius: '20px',
        padding: '6px 12px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid #e5e7eb',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#e5e7eb';
        e.currentTarget.style.borderColor = '#d1d5db';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f3f4f6';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      <div style={{ display: 'flex', gap: '-4px', marginRight: '4px' }}>
        {displayReactions.map(([reaction]) => (
          <span
            key={reaction}
            style={{
              fontSize: '16px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {reaction}
          </span>
        ))}
      </div>
      <span
        style={{
          color: '#6b7280',
          fontWeight: '600',
          fontSize: '13px',
        }}
      >
        {totalReactions}
      </span>
    </div>
  );
};