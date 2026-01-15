import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import PiInterstitialAd from '@/components/PiInterstitialAd';
import { supabase } from '@/integrations/supabase/client';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
}

interface StoryUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const StoryViewer = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { showInterstitial, isSupported } = usePiAdNetwork();

  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storyUser, setStoryUser] = useState<StoryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCounter, setAdCounter] = useState(0);

  useEffect(() => {
    if (username) {
      fetchStories();
    }
  }, [username]);

  useEffect(() => {
    if (stories.length > 0) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentIndex < stories.length - 1) {
              const nextIndex = currentIndex + 1;
              setCurrentIndex(nextIndex);
              
              // Show ad every 3 stories
              setAdCounter(c => c + 1);
              if (isSupported && adCounter > 0 && adCounter % 3 === 0) {
                showInterstitial();
              }
              
              return 0;
            } else {
              navigate(-1);
              return prev;
            }
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [stories, currentIndex, navigate, adCounter, isSupported, showInterstitial]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const fetchStories = async () => {
    setLoading(true);

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      navigate('/');
      return;
    }

    setStoryUser(profileData);

    // Get active stories (within 24 hours)
    const { data: storiesData, error: storiesError } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', profileData.user_id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
    }

    if (!storiesData || storiesData.length === 0) {
      console.log('No active stories found for user:', username);
      navigate(`/profile/${username}`);
      return;
    }

    setStories(storiesData);
    setLoading(false);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <LoadingLogo size="md" />
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-10">
        {storyUser && (
          <Link to={`/profile/${storyUser.username}`} className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-white">
              <AvatarImage src={storyUser.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-sm">
                {storyUser.display_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="text-sm font-semibold">{storyUser.username}</p>
              <p className="text-xs opacity-70">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate(-1)}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Story Image */}
      <div className="flex h-full items-center justify-center">
        <img
          src={currentStory.image_url}
          alt="Story"
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-0 right-0 px-4 text-center">
          <p className="text-white text-lg drop-shadow-lg">{currentStory.caption}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="absolute inset-y-0 left-0 w-1/3" onClick={goToPrevious} />
      <div className="absolute inset-y-0 right-0 w-1/3" onClick={goToNext} />

      {/* Navigation buttons (visible on hover) */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={goToNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Pi Ads Modal */}
      <PiInterstitialAd
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
      />
    </div>
  );
};

export default StoryViewer;
