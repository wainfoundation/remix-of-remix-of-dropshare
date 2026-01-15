import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/card';
import { Video, MoreHorizontal } from 'lucide-react';

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  thumbnail_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const ReelsCarousel = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    const { data: reelsData, error } = await supabase
      .from('reels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching reels:', error);
      setLoading(false);
      return;
    }

    if (!reelsData || reelsData.length === 0) {
      setReels([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(reelsData.map((r) => r.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap = (profilesData || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    const enrichedReels = reelsData.map((reel) => ({
      ...reel,
      profiles: profilesMap[reel.user_id] || {
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: null,
      },
    }));

    setReels(enrichedReels);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Reels</h2>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 h-56 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-background border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Reels</h2>
        </div>
        <button
          onClick={() => navigate('/reels')}
          className="text-sm text-primary hover:underline font-medium"
        >
          See more
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {reels.map((reel) => (
          <Card
            key={reel.id}
            className="flex-shrink-0 w-32 h-56 cursor-pointer overflow-hidden relative group"
            onClick={() => navigate(`/reels/${reel.id}`)}
          >
            {reel.thumbnail_url ? (
              <img
                src={reel.thumbnail_url}
                alt={reel.caption || 'Reel'}
                className="w-full h-full object-cover"
              />
            ) : reel.video_url ? (
              <video
                src={reel.video_url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <div className={`w-full h-full ${theme === 'dark' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-400 to-purple-400'} flex items-center justify-center`}>
                <Video className="h-12 w-12 text-white" />
              </div>
            )}
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-t from-black/70 via-transparent to-transparent' : 'bg-gradient-to-t from-gray-900/70 via-transparent to-transparent'}`} />
            <div className="absolute top-2 right-2">
              <MoreHorizontal className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">
                {reel.caption || 'Watch reel'}
              </p>
              <p className="text-white/80 text-xs mt-1 drop-shadow-lg">
                @{reel.profiles.username}
              </p>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReelsCarousel;
