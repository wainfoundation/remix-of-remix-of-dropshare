import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user_id: string;
  reel_id: string;
  content: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface ReelCommentsProps {
  reelId: string;
  onClose: () => void;
}

const ReelComments = ({ reelId, onClose }: ReelCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [reelId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('reel_comments')
      .select('*')
      .eq('reel_id', reelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    setComments(
      data.map(c => ({
        ...c,
        profile: profilesMap[c.user_id] || {
          username: 'unknown',
          display_name: 'Unknown User',
          avatar_url: null,
        },
      }))
    );
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('reel_comments').insert({
      user_id: user.id,
      reel_id: reelId,
      content: newComment.trim(),
    });

    if (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    setNewComment('');
    setSubmitting(false);
    fetchComments();
  };

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/50' : 'bg-white/50'} z-50 flex items-end md:items-center md:justify-center`}>
      <div 
        className={`${theme === 'dark' ? 'bg-background' : 'bg-white'} rounded-t-2xl md:rounded-2xl w-full md:max-w-lg md:max-h-[80vh] flex flex-col`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className={theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-600 hover:text-black'}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Comments list */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingLogo size="md" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar 
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => {
                      navigate(`/profile/${comment.profile.username}`);
                      onClose();
                    }}
                  >
                    <AvatarImage src={comment.profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.profile.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigate(`/profile/${comment.profile.username}`);
                          onClose();
                        }}
                        className="font-semibold text-sm hover:underline"
                      >
                        {comment.profile.username}
                      </button>
                      <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>No comments yet</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'} mt-1`}>Be the first to comment!</p>
            </div>
          )}
        </ScrollArea>

        {/* Comment input */}
        <form onSubmit={handleSubmit} className={`p-4 ${theme === 'dark' ? 'border-t border-border' : 'border-t border-gray-200'}`}>
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={submitting}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || submitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReelComments;
