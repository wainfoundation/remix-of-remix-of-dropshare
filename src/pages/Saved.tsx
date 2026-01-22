import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Link } from 'react-router-dom';

interface Post {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
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
}

const Saved = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    }
  }, [user]);

  const fetchSavedPosts = async () => {
    setLoading(true);

    // Get saved post IDs for current user
    const { data: savedData, error: savedError } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user?.id);

    if (savedError) {
      console.error('Error fetching saved posts:', savedError);
      setLoading(false);
      return;
    }

    const postIds = (savedData || []).map(s => s.post_id);

    if (postIds.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Get the actual posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setLoading(false);
      return;
    }

    // Fetch profiles for posts
    const userIds = [...new Set((postsData || []).map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, account_type')
      .in('user_id', userIds);

    const profilesMap = (profilesData || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Get likes and comment counts
    const [likesCountResult, commentsCountResult, userLikesResult] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
      supabase.from('likes').select('post_id').eq('user_id', user?.id).in('post_id', postIds),
    ]);

    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    const userLikes = new Set((userLikesResult.data || []).map(l => l.post_id));

    (likesCountResult.data || []).forEach(l => {
      likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
    });

    (commentsCountResult.data || []).forEach(c => {
      commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
    });

    const enrichedPosts = (postsData || []).map((post) => ({
      ...post,
      profiles: profilesMap[post.user_id] as Post['profiles'],
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
      is_liked: userLikes.has(post.id),
      is_saved: true,
    }));

    setPosts(enrichedPosts);
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.is_liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
    }

    // Refresh posts
    await fetchSavedPosts();
  };

  const handleSave = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.is_saved) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to see saved posts</h2>
          <p className="mt-2 text-muted-foreground">
            Save posts to view them later.
          </p>
          <div className="mt-6 flex gap-4">
            <Button asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        {/* Header for mobile */}
        <header className="glass backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden">
          <h1 className="text-xl font-bold text-white">Saved</h1>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingLogo size="md" />
          </div>
        ) : posts.length > 0 ? (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onSave={handleSave}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h2 className="text-xl font-semibold">No saved posts yet</h2>
            <p className="mt-2 text-muted-foreground">
              Save posts to view them here later.
            </p>
            <Button asChild className="mt-6">
              <Link to="/explore">Explore posts</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Saved;
