import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StoryBar from '@/components/feed/StoryBar';
import PostCard from '@/components/feed/PostCard';
import FeedComposer from '@/components/feed/FeedComposer';
import ReelsCarousel from '@/components/feed/ReelsCarousel';
import StoriesCarousel from '@/components/feed/StoriesCarousel';
import PiBannerAd from '@/components/PiBannerAd';
import PiInterstitialAd from '@/components/PiInterstitialAd';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { Search, MessageCircle, Bookmark, Bell, Plus } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
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

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'foryou' | 'following'>('foryou');
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const { user, profile } = useAuth();
  const { scrollDirection } = useScrollDirection();
  const { showInterstitial, isSupported } = usePiAdNetwork();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [user, feedType]);

  // Show interstitial ad every 2 minutes (if supported)
  useEffect(() => {
    if (!isSupported) return;

    const timer = setInterval(async () => {
      // Show ad at natural break point
      const shown = await showInterstitial();
      if (shown) {
        console.log("Interstitial ad displayed");
      }
    }, 120000); // 2 minutes

    return () => clearInterval(timer);
  }, [isSupported, showInterstitial]);

  const fetchPosts = async () => {
    setLoading(true);
    
    let postsQuery = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // If "Following" feed is selected and user is logged in, filter by followed users
    if (feedType === 'following' && user) {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = (followingData || []).map(f => f.following_id);
      
      if (followingIds.length === 0) {
        // No one is being followed
        setPosts([]);
        setLoading(false);
        return;
      }
      
      postsQuery = postsQuery.in('user_id', followingIds);
    } else if (feedType === 'following' && !user) {
      // If following is selected but user is not logged in, reset to foryou
      setFeedType('foryou');
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data: postsData, error } = await postsQuery;

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
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

    const enrichedPosts = (postsData || []).map((post) => ({
      ...post,
      profiles: profilesMap[post.user_id] as Post['profiles'],
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
      is_liked: likedPostIds.has(post.id),
      is_saved: savedPostIds.has(post.id),
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
      <div className="mx-auto w-full">
        {/* Header for mobile */}
        <header 
          className={`sticky top-0 z-40 md:hidden transition-transform duration-300 ease-out ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}
        >
          {/* Top bar */}
          <div className="relative flex h-14 items-center justify-center border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="absolute left-4">
              <button
                onClick={() => navigate('/explore')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center">
              <AppLogo size="md" />
            </div>
            <div className="absolute right-4 flex items-center gap-4">
              <button
                onClick={() => navigate('/notifications')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Messages"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate('/saved')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Saved"
              >
                <Bookmark className="h-6 w-6" />
              </button>
            </div>
          </div>
          {/* Tabs inside header (mobile) */}
          <div className="flex border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <button
              onClick={() => setFeedType('foryou')}
              className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-colors ${
                feedType === 'foryou'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => user && setFeedType('following')}
              disabled={!user}
              className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-colors ${
                feedType === 'following'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Following
            </button>
          </div>
        </header>

        {/* Desktop Header with Search */}
        <div className="hidden md:block sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold">Home</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/explore')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feed Tabs (desktop only) */}
        <div className="hidden md:flex border-b border-border md:bg-transparent">
          <button
            onClick={() => setFeedType('foryou')}
            className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-colors ${
              feedType === 'foryou'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => user && setFeedType('following')}
            disabled={!user}
            className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-colors ${
              feedType === 'following'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Following
          </button>
        </div>

        <StoriesCarousel />
        <ReelsCarousel />
        <StoryBar />
        {/* Composer: what's on your mind + quick photo/video */}
        <FeedComposer onPosted={fetchPosts} />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingLogo size="md" />
          </div>
        ) : posts.length > 0 ? (
          <div className="divide-y divide-border">
            {/* Show ad every 3 posts */}
            {posts.map((post, index) => (
              <div key={post.id}>
                {index > 0 && index % 3 === 0 && <PiBannerAd className="border-0 mb-4 mt-4" />}
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              </div>
            ))}
          </div>
        ) : feedType === 'following' ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h2 className="text-xl font-semibold">No posts yet</h2>
            <p className="mt-2 text-muted-foreground">
              Follow more accounts to see their posts in your feed.
            </p>
            <Button asChild className="mt-6">
              <Link to="/explore">Find accounts to follow</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h2 className="text-xl font-semibold">Welcome to DropShare</h2>
            <p className="mt-2 text-muted-foreground">
              {profile ? (
                profile.account_type === 'business' ? (
                  'Start sharing your products with the world!'
                ) : (
                  'Follow businesses to see their products in your feed.'
                )
              ) : (
                'Sign up to discover amazing products from your favorite stores.'
              )}
            </p>
            {!profile && (
              <div className="mt-6 flex gap-4">
                <Button asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
              </div>
            )}
            {profile?.account_type === 'business' && (
              <Button asChild className="mt-6">
                <Link to="/create">Create Your First Post</Link>
              </Button>
            )}
          </div>
        )}

        {/* Interstitial Ad Modal */}
        <PiInterstitialAd 
          isOpen={showInterstitialAd}
          onClose={() => setShowInterstitialAd(false)}
        />
      </div>

      {profile && (
        <Button
          size="lg"
          className="fixed bottom-20 right-4 md:bottom-24 md:right-8 rounded-full shadow-lg h-12 w-12 p-0"
          onClick={() => navigate('/create')}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </MainLayout>
  );
};

export default Index;
