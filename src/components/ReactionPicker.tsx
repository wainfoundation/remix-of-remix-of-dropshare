import React, { useEffect, useRef } from 'react';
import { ReactionType } from '../hooks/useReactions';

interface ReactionPickerProps {
  onSelect: (reaction: ReactionType) => void;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose?: () => void;
}

const REACTIONS: ReactionType[] = ['👍', '❤️', '😂', '😮', '😢', '😠'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelect,
  isVisible,
  position,
  onClose,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-100%) translateX(-50%)',
        zIndex: 50,
        background: 'white',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        padding: '8px',
        display: 'flex',
        gap: '8px',
        border: '1px solid #e5e7eb',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      {REACTIONS.map((reaction) => (
        <button
          key={reaction}
          onClick={() => onSelect(reaction)}
          title={reaction}
          style={{
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            border: 'none',
            background: 'transparent',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.3)';
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {reaction}
        </button>
      ))}
      
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(-80%) translateX(-50%);
            }
            to {
              opacity: 1;
              transform: translateY(-100%) translateX(-50%);
            }
          }
        `}
      </style>
    </div>
  );
};