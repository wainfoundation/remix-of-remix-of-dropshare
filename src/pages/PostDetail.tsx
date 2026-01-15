import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Send, Bookmark, MoreHorizontal, ExternalLink, Flag, Share2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  product_name: string | null;
  price: number | null;
  external_link: string | null;
  created_at: string;
  post_type?: 'text' | 'image' | 'video' | 'reel';
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: Profile;
}

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    setLoading(true);

    // Fetch post
    const { data: postData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error || !postData) {
      console.error('Error fetching post:', error);
      setLoading(false);
      return;
    }

    setPost(postData);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', postData.user_id)
      .maybeSingle();

    setProfile(profileData);

    // Fetch comments with profiles
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, Profile>);

      setComments(
        commentsData.map(c => ({
          ...c,
          profile: profilesMap[c.user_id],
        }))
      );
    }

    // Fetch likes count
    const { count } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('post_id', postId);

    setLikesCount(count || 0);

    // Check if user liked/saved
    if (user) {
      const [likeResult, saveResult] = await Promise.all([
        supabase.from('likes').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle(),
        supabase.from('saved_posts').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle(),
      ]);

      setIsLiked(!!likeResult.data);
      setIsSaved(!!saveResult.data);
    }

    setLoading(false);
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Please log in to like posts', variant: 'destructive' });
      return;
    }

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Please log in to save posts', variant: 'destructive' });
      return;
    }

    setIsSaved(!isSaved);

    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
    } else {
      await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    } else {
      // Get user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      setComments([...comments, { ...data, profile: profileData as Profile }]);
      setNewComment('');
      toast({ title: 'Comment posted!' });
    }

    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments(comments.filter(c => c.id !== commentId));
    toast({ title: 'Comment deleted' });
  };

  const handleReport = () => {
    setReportDialogOpen(false);
    toast({ title: 'Post reported', description: 'Thank you for your report. We will review it shortly.' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.product_name || 'Check out this post',
          text: post?.caption || '',
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    }
    setShareDialogOpen(false);
  };

  const handleDeletePost = async () => {
    if (!post) return;

    await supabase.from('posts').delete().eq('id', post.id);
    toast({ title: 'Post deleted' });
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingLogo size="md" />
      </div>
    );
  }

  if (!post || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h2 className="text-xl font-semibold">Post not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-lg font-semibold">Post</h1>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              {!isOwner && (
                <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              )}
              {post.external_link && (
                <DropdownMenuItem asChild>
                  <a href={post.external_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Store
                  </a>
                </DropdownMenuItem>
              )}
              {isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Post Content */}
      <div className="md:flex md:h-[calc(100vh-3.5rem)]">
        {/* Image/Video */}
        <div className="relative aspect-square w-full bg-secondary md:h-full md:w-1/2 lg:w-3/5">
          {post.post_type === 'video' ? (
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
            />
          )}
          {post.price && (
            <div className="absolute bottom-4 left-4 rounded-full bg-background/90 px-4 py-2 font-semibold backdrop-blur">
              ${post.price.toFixed(2)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col md:h-full md:w-1/2 lg:w-2/5">
          {/* Author */}
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Link to={`/profile/${profile.username}`}>
              <Avatar>
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary">
                  {profile.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link to={`/profile/${profile.username}`} className="font-semibold hover:underline">
                {profile.username}
              </Link>
              {post.product_name && (
                <p className="text-sm text-muted-foreground">{post.product_name}</p>
              )}
            </div>
            {post.external_link && (
              <Button size="sm" asChild>
                <a href={post.external_link} target="_blank" rel="noopener noreferrer">
                  Shop Now
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>

          {/* Caption & Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Caption */}
            {post.caption && (
              <div className="mb-4 flex gap-3">
                <Link to={`/profile/${profile.username}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-sm">
                      {profile.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <p className="text-sm">
                    <Link to={`/profile/${profile.username}`} className="font-semibold">
                      {profile.username}
                    </Link>{' '}
                    {post.caption}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Link to={`/profile/${comment.profile?.username}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-sm">
                        {comment.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <p className="text-sm">
                      <Link to={`/profile/${comment.profile?.username}`} className="font-semibold">
                        {comment.profile?.username || 'Unknown'}
                      </Link>{' '}
                      {comment.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="transition-transform active:scale-90">
                  <Heart className={cn("h-6 w-6", isLiked && "fill-red-500 text-red-500")} />
                </button>
                <button onClick={() => setShareDialogOpen(true)}>
                  <Send className="h-6 w-6" />
                </button>
              </div>
              <button onClick={handleSave} className="transition-transform active:scale-90">
                <Bookmark className={cn("h-6 w-6", isSaved && "fill-foreground")} />
              </button>
            </div>
            {likesCount > 0 && (
              <p className="mt-2 text-sm font-semibold">
                {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
              </p>
            )}
          </div>

          {/* Comment Input */}
          {user && (
            <form onSubmit={handleComment} className="flex items-center gap-2 border-t border-border p-4">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newComment.trim() || submitting}>
                Post
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to report this post? Our team will review it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport}>Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
            <DialogDescription>
              Share this post with others.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={window.location.href} readOnly />
            <Button onClick={handleShare}>Copy</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePost}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostDetail;
