import { Type, Image, Video, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PostType = 'text' | 'image' | 'video' | 'reel';

interface PostTypeSelectorProps {
  selected: PostType;
  onSelect: (type: PostType) => void;
}

const postTypes = [
  { type: 'text' as const, icon: Type, label: 'Text', description: 'Share your thoughts' },
  { type: 'image' as const, icon: Image, label: 'Image', description: 'Photos & graphics' },
  { type: 'video' as const, icon: Video, label: 'Video', description: 'Video content' },
  { type: 'reel' as const, icon: Zap, label: 'Short', description: 'Quick tweet-style' },
];

const PostTypeSelector = ({ selected, onSelect }: PostTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {postTypes.map(({ type, icon: Icon, label, description }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all',
            selected === type
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:bg-secondary'
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default PostTypeSelector;