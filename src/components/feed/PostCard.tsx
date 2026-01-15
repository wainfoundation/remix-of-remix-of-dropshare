import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ExternalLink, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useTrackShare } from '@/hooks/use-post-views';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    image_url: string | null;
    caption: string | null;
    title?: string | null;
    description?: string | null;
    product_name: string | null;
    price: number | null;
    external_link: string | null;
    created_at: string;
    post_type?: 'text' | 'image' | 'video' | 'reel';
    profiles: {
      username: string;
      display_name: string;
      avatar_url: string | null;
      account_type: 'business' | 'shopper' | 'creator';
    };
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    is_saved: boolean;
  };
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
}

const PostCard = ({ post, onLike, onSave }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const { trackShare } = useTrackShare(post.id);
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike(post.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave(post.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.caption || 'Check out this post',
          url,
        });
        await trackShare();
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(url);
      await trackShare();
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard',
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false });
  const postType = post.post_type || 'image';
  const isTextOnly = postType === 'text' || postType === 'reel';
  const isReel = postType === 'reel';

  return (
    <article className="border-b border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          to={`/profile/${post.profiles.username}`}
          className="flex items-center gap-3"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-sm">
              {post.profiles.display_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{post.profiles.username}</span>
            {post.product_name && (
              <span className="text-xs text-muted-foreground">{post.product_name}</span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {isReel && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Short
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
              {post.external_link && (
                <DropdownMenuItem asChild>
                  <a href={post.external_link} target="_blank" rel="noopener noreferrer">
                    Visit Store
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {isTextOnly ? (
        // Text-only post or reel/tweet style
        <div className={cn(
          "px-4 py-4",
          isReel 
            ? "bg-gradient-to-br from-primary/5 to-primary/10 border-y border-border" 
            : "bg-secondary/30"
        )}>
          {post.title && (
            <h3 className="font-bold text-lg mb-2">{post.title}</h3>
          )}
          <p className={cn(
            "whitespace-pre-wrap",
            isReel ? "text-lg font-medium leading-relaxed" : "text-base"
          )}>
            {post.caption}
          </p>
          {post.description && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              {post.description}
            </p>
          )}
        </div>
      ) : post.image_url ? (
        // Image/Video post
        <div className="relative aspect-square w-full bg-secondary">
          {postType === 'video' ? (
            <video
              src={post.image_url}
              className="h-full w-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={post.image_url}
              alt={post.caption || 'Post'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {/* Price Tag */}
          {post.price && (
            <div className="absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold backdrop-blur">
              ${post.price.toFixed(2)}
            </div>
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="transition-transform active:scale-90"
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={cn(
                  "h-6 w-6",
                  isLiked && "fill-red-500 text-red-500"
                )}
              />
            </button>
            <Link to={`/post/${post.id}`} aria-label="View comments">
              <MessageCircle className="h-6 w-6" />
            </Link>
            <button onClick={handleShare} aria-label="Share">
              <Share2 className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {post.external_link && (
              <a
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Shop Now
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              onClick={handleSave}
              className="transition-transform active:scale-90"
              aria-label={isSaved ? 'Unsave' : 'Save'}
            >
              <Bookmark
                className={cn(
                  "h-6 w-6",
                  isSaved && "fill-foreground"
                )}
              />
            </button>
          </div>
        </div>

        {/* Likes Count */}
        {likesCount > 0 && (
          <p className="mt-2 text-sm font-semibold">
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Title & Caption - only show for non-text posts */}
        {!isTextOnly && (
          <>
            {post.title && (
              <h3 className="mt-2 font-bold text-base">{post.title}</h3>
            )}
            {post.caption && (
              <p className="mt-1 text-sm">
                <Link to={`/profile/${post.profiles.username}`} className="font-semibold">
                  {post.profiles.username}
                </Link>{' '}
                {post.caption}
              </p>
            )}
            {post.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {post.description}
              </p>
            )}
          </>
        )}

        {/* Comments Preview */}
        {post.comments_count > 0 && (
          <Link
            to={`/post/${post.id}`}
            className="mt-1 block text-sm text-muted-foreground"
          >
            View all {post.comments_count} comments
          </Link>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-xs uppercase text-muted-foreground">{timeAgo} ago</p>
      </div>
    </article>
  );
};

export default PostCard;