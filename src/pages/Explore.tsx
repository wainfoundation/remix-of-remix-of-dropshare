import { useEffect, useState } from 'react';
import { Search, FileText, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PiAdComponent } from '@/components/PiAdComponent';
import { LoadingLogo } from '@/components/ui/loading-logo';

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

const Explore = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'top' | 'latest'>('top');

  useEffect(() => {
    fetchPosts();
  }, [searchTab, searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    
    let postsQuery = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);


    // Apply search filter if there's a query
    if (searchQuery) {
      postsQuery = postsQuery.or(`caption.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%`);
    }

    const { data: postsData, error } = await postsQuery;

    if (error) {
      console.error('Error fetching posts:', error);
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

    // Get likes and saved status for current user
    let likesData: { post_id: string }[] = [];
    let savedData: { post_id: string }[] = [];

    if (user) {
      const [likesResult, savedResult] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', user.id),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id),
      ]);
      
      likesData = likesResult.data || [];
      savedData = savedResult.data || [];
    }

    const likedPostIds = new Set(likesData.map((l) => l.post_id));
    const savedPostIds = new Set(savedData.map((s) => s.post_id));

    // Get counts
    const postIds = postsData?.map((p) => p.id) || [];
    
    const [likesCountResult, commentsCountResult] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ]);

    const likesCount = (likesCountResult.data || []).reduce((acc, l) => {
      acc[l.post_id] = (acc[l.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commentsCount = (commentsCountResult.data || []).reduce((acc, c) => {
      acc[c.post_id] = (acc[c.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let enrichedPosts = (postsData || []).map((post) => ({
      ...post,
      profiles: profilesMap[post.user_id] as Post['profiles'],
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
      is_liked: likedPostIds.has(post.id),
      is_saved: savedPostIds.has(post.id),
    }));

    // Sort by tab: 'top' (likes desc) or 'latest' (created_at desc)
    if (searchTab === 'top') {
      enrichedPosts = enrichedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else {
      enrichedPosts = enrichedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

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
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        {/* Search Header */}
        <div className="sticky top-0 z-40 glass backdrop-blur-xl px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full glass-subtle border-white/10 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {/* Search Tabs */}
        <div className="sticky top-14 z-30 flex border-b border-white/10 glass backdrop-blur-xl md:static md:top-auto md:z-auto">
          <button
            onClick={() => setSearchTab('top')}
            className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-all ${
              searchTab === 'top'
                ? 'border-primary text-white'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setSearchTab('latest')}
            className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-all ${
              searchTab === 'latest'
                ? 'border-primary text-white'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            Latest
          </button>
        </div>

        {/* Grid Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingLogo size="md" />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 p-1">
            {posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.caption || post.product_name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white p-2">
                      <div className="flex items-center gap-1 text-xs">
                        <FileText className="h-4 w-4" />
                        <span className="line-clamp-3">{post.caption || post.product_name || 'Post'}</span>
                      </div>
                    </div>
                  )}
                  {/* Overlay for caption snippet */}
                  {(post.caption || post.product_name) && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-[10px] px-2 py-1 line-clamp-1">
                      {post.caption || post.product_name}
                    </div>
                  )}
                  {/* Media type indicator */}
                  {post.post_type === 'reel' || post.post_type === 'video' ? (
                    <div className="absolute top-1 right-1 bg-black/50 text-white rounded px-1">
                      <Play className="h-3 w-3" />
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-muted-foreground">No results found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Explore;
