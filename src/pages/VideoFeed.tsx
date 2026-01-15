import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import PiBannerAd from '@/components/PiBannerAd';
import PiInterstitialAd from '@/components/PiInterstitialAd';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Play } from 'lucide-react';

interface VideoPost {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  product_name: string | null;
  price: number | null;
  external_link: string | null;
  created_at: string;
  post_type: 'video';
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

const VideoFeed = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const { user, profile } = useAuth();
  const { showInterstitial, isSupported } = usePiAdNetwork();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, [user]);

  // Show interstitial ad every 2 minutes (if supported)
  useEffect(() => {
    if (!isSupported) return;

    const timer = setInterval(async () => {
      const shown = await showInterstitial();
      if (shown) {
        console.log("Interstitial ad displayed");
      }
    }, 120000); // 2 minutes

    return () => clearInterval(timer);
  }, [isSupported, showInterstitial]);

  const fetchVideos = async () => {
    setLoading(true);
    
    // Fetch only video type posts (exclude reels)
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('post_type', 'video')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for posts
    const userIds = [...new Set((postsData || []).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, account_type')
      .in('user_id', userIds);

    const profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Fetch likes
    let likesMap: Record<string, boolean> = {};
    if (user) {
      const postIds = (postsData || []).map(p => p.id);
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      likesMap = (likes || []).reduce((acc, like) => {
        acc[like.post_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Fetch saved posts
    let savedMap: Record<string, boolean> = {};
    if (user) {
      const postIds = (postsData || []).map(p => p.id);
      const { data: saved } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      savedMap = (saved || []).reduce((acc, save) => {
        acc[save.post_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Fetch likes and comments counts
    const postIds = (postsData || []).map(p => p.id);
    const { data: likesCount } = await supabase
      .from('likes')
      .select('post_id')
      .in('post_id', postIds);

    const { data: commentsCount } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    const likesCountMap = (likesCount || []).reduce((acc, like) => {
      acc[like.post_id] = (acc[like.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commentsCountMap = (commentsCount || []).reduce((acc, comment) => {
      acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const videoPosts = (postsData || []).map(post => ({
      ...post,
      post_type: 'video' as const,
      profiles: profilesMap[post.user_id],
      likes_count: likesCountMap[post.id] || 0,
      comments_count: commentsCountMap[post.id] || 0,
      is_liked: likesMap[post.id] || false,
      is_saved: savedMap[post.id] || false,
    }));

    setVideos(videoPosts);
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const video = videos.find(v => v.id === postId);
    if (!video) return;

    if (video.is_liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setVideos(videos.map(v =>
        v.id === postId
          ? { ...v, is_liked: false, likes_count: v.likes_count - 1 }
          : v
      ));
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });

      setVideos(videos.map(v =>
        v.id === postId
          ? { ...v, is_liked: true, likes_count: v.likes_count + 1 }
          : v
      ));
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const video = videos.find(v => v.id === postId);
    if (!video) return;

    if (video.is_saved) {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setVideos(videos.map(v =>
        v.id === postId ? { ...v, is_saved: false } : v
      ));
    } else {
      await supabase
        .from('saved_posts')
        .insert({ post_id: postId, user_id: user.id });

      setVideos(videos.map(v =>
        v.id === postId ? { ...v, is_saved: true } : v
      ));
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-center px-4 py-4">
            <div className="flex items-center gap-2">
              <Play className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Videos</h1>
            </div>
          </div>
        </div>

        {/* Videos Feed */}
        <div className="mx-auto max-w-2xl">
          {/* Pi Network Banner Ad */}
          <div className="mb-4">
            <PiBannerAd />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingLogo />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <Play className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Videos Yet</h2>
              <p className="text-muted-foreground mb-4">
                Be the first to upload a video!
              </p>
              {user && (
                <button
                  onClick={() => navigate('/create')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Upload Video
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              {videos.map((video, index) => (
                <div key={video.id}>
                  <PostCard
                    post={video}
                    onLike={handleLike}
                    onSave={handleSave}
                  />
                  {/* Show Pi Network ad every 5 videos */}
                  {(index + 1) % 5 === 0 && (
                    <div className="my-4">
                      <PiBannerAd />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pi Interstitial Ad Modal */}
        {showInterstitialAd && (
          <PiInterstitialAd 
            isOpen={showInterstitialAd}
            onClose={() => setShowInterstitialAd(false)} 
          />
        )}
      </div>
    </MainLayout>
  );
};

export default VideoFeed;
