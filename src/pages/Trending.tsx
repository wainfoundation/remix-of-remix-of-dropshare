import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingLogo } from '@/components/ui/loading-logo';

interface TrendingHashtag {
  id: string;
  tag: string;
  post_count: number;
}

interface Post {
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
}

const Trending = () => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  useEffect(() => {
    if (selectedHashtag) {
      fetchHashtagPosts(selectedHashtag);
    }
  }, [selectedHashtag, user]);

  const fetchTrendingHashtags = async () => {
    // Using loose typing for newly added tables until generated types are updated
    const { data, error } = await supabase
      .from('hashtags' as any)
      .select('id, tag, post_count')
      .gt('post_count', 0)
      .order('post_count', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching trending hashtags:', error);
      setLoading(false);
      return;
    }

    const list = (data as any[]) || [];
    setHashtags(list as TrendingHashtag[]);
    if (list.length > 0) {
      setSelectedHashtag((list[0] as any).tag);
    }
    setLoading(false);
  };

  const fetchHashtagPosts = async (hashtag: string) => {
    setPostsLoading(true);

    // Get hashtag ID
    const { data: hashtagData, error: hashtagError } = await supabase
      .from('hashtags' as any)
      .select('id')
      .eq('tag', hashtag)
      .single();

    if (!hashtagData || hashtagError || !(hashtagData as any)?.id) {
      setPostsLoading(false);
      return;
    }

    // Get post IDs with this hashtag
    const { data: postHashtags } = await supabase
      .from('post_hashtags' as any)
      .select('post_id')
      .eq('hashtag_id', (hashtagData as any).id);

    if (!postHashtags || (postHashtags as any[]).length === 0) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }

    const postIds = (postHashtags as any[]).map((ph) => ph.post_id);

    // Fetch posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }

    // Fetch profiles
    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, account_type')
      .in('user_id', userIds);

    const profilesMap = (profilesData || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Get likes and comments counts
    const [likesResult, commentsResult, userLikesResult, savedResult] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
      user ? supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] },
      user ? supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds) : { data: [] },
    ]);

    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    const userLikes = new Set((userLikesResult.data || []).map((l) => l.post_id));
    const userSaved = new Set((savedResult.data || []).map((s) => s.post_id));

    (likesResult.data || []).forEach((l) => {
      likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
    });
    (commentsResult.data || []).forEach((c) => {
      commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
    });

    const enrichedPosts = postsData.map((post) => ({
      ...post,
      profiles: profilesMap[post.user_id],
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
      is_liked: userLikes.has(post.id),
      is_saved: userSaved.has(post.id),
    }));

    setPosts(enrichedPosts);
    setPostsLoading(false);
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

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );
  };

  const handleSave = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.is_saved) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
    } else {
      await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_saved: !p.is_saved } : p
      )
    );
  };

  return (
    <MainLayout>
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="glass backdrop-blur-xl border-b border-white/10 px-4 py-3">
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <TrendingUp className="h-6 w-6" />
              Trending
            </h1>
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="border-b border-border">
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              TRENDING TOPICS
            </h2>
            {loading ? (
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-24 bg-muted rounded-full animate-pulse"
                  />
                ))}
              </div>
            ) : hashtags.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {hashtags.map((hashtag) => (
                  <button
                    key={hashtag.id}
                    onClick={() => setSelectedHashtag(hashtag.tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedHashtag === hashtag.tag
                        ? 'glass-strong text-white'
                        : 'glass-subtle text-white/80 hover:glass'
                    }`}
                  >
                    <Hash className="h-3 w-3 inline mr-1" />
                    {hashtag.tag}
                    <span className="ml-2 text-xs opacity-70">
                      {hashtag.post_count}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No trending topics yet
              </p>
            )}
          </div>
        </div>

        {/* Posts for selected hashtag */}
        {selectedHashtag && (
          <div>
            <div className="px-4 py-3 bg-secondary/30">
              <h2 className="text-sm font-semibold">
                Posts tagged #{selectedHashtag}
              </h2>
            </div>
            {postsLoading ? (
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
                <Hash className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No posts found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No posts with this hashtag yet
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Trending;
