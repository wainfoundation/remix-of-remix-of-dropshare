import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import ReelComments from '@/components/feed/ReelComments';
import ReelMenu from '@/components/feed/ReelMenu';
import PiInterstitialAd from '@/components/PiInterstitialAd';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { useToast } from '@/hooks/use-toast';

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration: number;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

const Reels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { showInterstitial, isSupported } = usePiAdNetwork();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState<{ [key: string]: boolean }>({});
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCounter, setAdCounter] = useState(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReels();
  }, [user]);

  const fetchReels = async () => {
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching reels:', error);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((data || []).map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Get likes and comments counts
    const reelIds = (data || []).map(r => r.id);
    
    const [likesResult, commentsResult, userLikesResult] = await Promise.all([
      supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds),
      supabase.from('reel_comments').select('reel_id').in('reel_id', reelIds),
      user ? supabase.from('reel_likes').select('reel_id').eq('user_id', user.id).in('reel_id', reelIds) : { data: [] },
    ]);

    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    const userLikes = new Set((userLikesResult.data || []).map(l => l.reel_id));

    (likesResult.data || []).forEach(l => {
      likesCount[l.reel_id] = (likesCount[l.reel_id] || 0) + 1;
    });
    (commentsResult.data || []).forEach(c => {
      commentsCount[c.reel_id] = (commentsCount[c.reel_id] || 0) + 1;
    });

    setReels(
      (data || []).map(r => ({
        ...r,
        profile: profilesMap[r.user_id],
        likes_count: likesCount[r.id] || 0,
        comments_count: commentsCount[r.id] || 0,
        is_liked: userLikes.has(r.id),
      }))
    );
    setLoading(false);
  };

  const handleLike = async (reelId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;

    if (reel.is_liked) {
      await supabase.from('reel_likes').delete().eq('user_id', user.id).eq('reel_id', reelId);
    } else {
      await supabase.from('reel_likes').insert({ user_id: user.id, reel_id: reelId });
    }

    setReels(reels.map(r => 
      r.id === reelId 
        ? { ...r, is_liked: !r.is_liked, likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1 }
        : r
    ));
  };

  const handleShare = async (reel: Reel) => {
    const url = `${window.location.origin}/reels/${reel.id}`;
    if (navigator.share) {
      await navigator.share({ url, title: reel.caption || 'Check out this reel!' });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!' });
    }
  };

  const togglePlayPause = (reelId: string) => {
    const video = videoRefs.current[reelId];
    if (video) {
      if (video.paused) {
        video.play();
        setPlaying(p => ({ ...p, [reelId]: true }));
      } else {
        video.pause();
        setPlaying(p => ({ ...p, [reelId]: false }));
      }
    }
  };

  useEffect(() => {
    const handleScroll = async () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const height = containerRef.current.clientHeight;
      const newIndex = Math.round(scrollTop / height);
      
      if (newIndex !== currentIndex) {
        // Pause previous video
        const prevReel = reels[currentIndex];
        if (prevReel && videoRefs.current[prevReel.id]) {
          videoRefs.current[prevReel.id]?.pause();
        }
        
        // Play new video
        const newReel = reels[newIndex];
        if (newReel && videoRefs.current[newReel.id]) {
          videoRefs.current[newReel.id]?.play();
          setPlaying(p => ({ ...p, [newReel.id]: true }));
        }
        
        setCurrentIndex(newIndex);
        
        // Show ad every 3 reels (like Facebook/Instagram)
        setAdCounter(prev => prev + 1);
        if (isSupported && adCounter > 0 && adCounter % 3 === 0) {
          await showInterstitial();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [currentIndex, reels, adCounter, isSupported, showInterstitial]);

  if (loading) {
    return (
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-white'} flex items-center justify-center`}>
        <LoadingLogo size="md" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-white'} overflow-y-scroll snap-y snap-mandatory`}
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {reels.length === 0 ? (
        <div className={`h-screen flex flex-col items-center justify-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <Play className={`h-16 w-16 mb-4 opacity-50 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          <h2 className="text-xl font-semibold">No reels yet</h2>
          <p className={`mt-2 ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Be the first to share a reel!</p>
          <Button onClick={() => navigate('/create-reel')} className="mt-4">
            Create Reel
          </Button>
        </div>
      ) : (
        reels.map((reel, index) => (
          <div 
            key={reel.id} 
            className="h-screen w-full snap-start relative flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={el => { videoRefs.current[reel.id] = el; }}
              src={reel.video_url}
              className="h-full w-full object-contain"
              loop
              muted={muted}
              playsInline
              onClick={() => togglePlayPause(reel.id)}
              poster={reel.thumbnail_url || undefined}
            />
            
            {/* Play/Pause overlay */}
            {!playing[reel.id] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`rounded-full ${theme === 'dark' ? 'bg-black/30' : 'bg-white/30'} p-4`}>
                  <Play className={`h-12 w-12 ${theme === 'dark' ? 'text-white fill-white' : 'text-black fill-black'}`} />
                </div>
              </div>
            )}

            {/* Right sidebar actions */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
              <button onClick={() => navigate(`/profile/${reel.profile?.username}`)}>
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={reel.profile?.avatar_url || undefined} />
                  <AvatarFallback>{reel.profile?.display_name?.[0]}</AvatarFallback>
                </Avatar>
              </button>
              
              <button onClick={() => handleLike(reel.id)} className="flex flex-col items-center">
                <Heart className={`h-7 w-7 ${reel.is_liked ? 'fill-red-500 text-red-500' : theme === 'dark' ? 'text-white' : 'text-black'}`} />
                <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-black'} mt-1`}>{reel.likes_count}</span>
              </button>
              
              <button onClick={() => setCommentsReelId(reel.id)} className="flex flex-col items-center">
                <MessageCircle className={`h-7 w-7 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-black'} mt-1`}>{reel.comments_count}</span>
              </button>
              
              <button onClick={() => handleShare(reel)} className="flex flex-col items-center">
                <Share2 className={`h-7 w-7 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
              </button>
              
              <ReelMenu reelId={reel.id} reelUserId={reel.user_id} onDelete={fetchReels} />
            </div>

            {/* Bottom info */}
            <div className="absolute left-4 right-16 bottom-24">
              <button 
                onClick={() => navigate(`/profile/${reel.profile?.username}`)}
                className="flex items-center gap-2 mb-2"
              >
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{reel.profile?.username}</span>
              </button>
              {reel.caption && (
                <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-black'} line-clamp-2`}>{reel.caption}</p>
              )}
            </div>

            {/* Mute button */}
            <button
              onClick={() => setMuted(!muted)}
              className={`absolute bottom-6 right-4 rounded-full ${theme === 'dark' ? 'bg-black/50' : 'bg-white/50'} p-2`}
            >
              {muted ? (
                <VolumeX className={`h-5 w-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
              ) : (
                <Volume2 className={`h-5 w-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
              )}
            </button>
          </div>
        ))
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className={`fixed top-4 left-4 z-50 ${theme === 'dark' ? 'text-white' : 'text-black'} font-semibold text-lg`}
      >
        Reels
      </button>

      {/* Create button */}
      <button
        onClick={() => navigate('/create-reel')}
        className={`fixed top-4 right-4 z-50 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </button>

      {/* Comments Modal */}
      {commentsReelId && (
        <ReelComments
          reelId={commentsReelId}
          onClose={() => setCommentsReelId(null)}
        />
      )}

      {/* Pi Ads Modal */}
      <PiInterstitialAd
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
      />
    </div>
  );
};

export default Reels;
