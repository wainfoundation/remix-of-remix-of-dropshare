import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, X } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const StoriesCarousel = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const now = new Date().toISOString();
    
    const { data: storiesData, error } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      setLoading(false);
      return;
    }

    if (!storiesData || storiesData.length === 0) {
      setStories([]);
      setLoading(false);
      return;
    }

    // Group by user and get the most recent story per user
    const userStoriesMap = storiesData.reduce((acc, story) => {
      if (!acc[story.user_id]) {
        acc[story.user_id] = story;
      }
      return acc;
    }, {} as Record<string, any>);

    const uniqueStories = Object.values(userStoriesMap);
    const userIds = uniqueStories.map((s: any) => s.user_id);

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap = (profilesData || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    const enrichedStories = uniqueStories.map((story: any) => ({
      ...story,
      profiles: profilesMap[story.user_id] || {
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: null,
      },
    }));

    // Filter out placeholder/test stories
    const filteredStories = enrichedStories.filter((s: any) => s.profiles?.username?.toLowerCase() !== 'test' && s.profiles?.display_name?.toLowerCase() !== 'test');
    setStories(filteredStories);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Stories</h2>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-24">
              <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
              <div className="w-20 h-3 bg-muted rounded mt-2 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-background border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Stories</h2>
        </div>
        <button
          onClick={() => navigate('/create-story')}
          className="text-sm text-primary hover:underline font-medium"
        >
          Create
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => navigate(`/story/${story.profiles.username}`)}
          >
            <Card className="w-24 h-24 rounded-full overflow-hidden relative p-1 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                {story.image_url ? (
                  <img
                    src={story.image_url}
                    alt={story.profiles.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar className="w-full h-full">
                    <AvatarImage src={story.profiles.avatar_url || ''} />
                    <AvatarFallback>
                      {story.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full" />
            </Card>
            <p className="text-xs text-center mt-2 text-muted-foreground line-clamp-1 px-1">
              {story.profiles.display_name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesCarousel;
