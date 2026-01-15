import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeIndicatorProps {
  direction: 'left' | 'right';
  className?: string;
  show?: boolean;
}

const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ 
  direction, 
  className,
  show = true 
}) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-30 pointer-events-none",
        "flex items-center justify-center w-8 h-16 rounded-lg",
        "bg-background/80 backdrop-blur-sm border border-border shadow-lg",
        "animate-pulse opacity-60",
        direction === 'left' ? 'left-2' : 'right-2',
        className
      )}
    >
      {direction === 'left' ? (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      ) : (
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
      )}
      <div className={cn(
        "absolute inset-0 rounded-lg animate-ping",
        "bg-gradient-to-r opacity-20",
        direction === 'left' 
          ? 'from-blue-500 to-purple-500' 
          : 'from-purple-500 to-blue-500'
      )} />
    </div>
  );
};

export default SwipeIndicator;