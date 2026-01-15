import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StoryUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

const StoryBar = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);

  useEffect(() => {
    fetchStoriesUsers();
  }, []);

  const fetchStoriesUsers = async () => {
    // Get users with active stories
    const { data: storiesData } = await supabase
      .from('stories')
      .select('user_id')
      .gt('expires_at', new Date().toISOString());

    const userIds = [...new Set((storiesData || []).map(s => s.user_id))];

    if (userIds.length === 0) {
      setStoryUsers([]);
      return;
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    // Filter out placeholder/test users
    const filtered = (profilesData || []).filter((p) => p.username?.toLowerCase() !== 'test');
    setStoryUsers(filtered);
  };

  const handleAddStory = () => {
    if (profile) {
      navigate('/create-story');
    }
  };

  return (
    <div className="border-b border-border bg-background px-4 py-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        {profile && (
          <button
            onClick={handleAddStory}
            className="flex flex-shrink-0 flex-col items-center gap-1"
          >
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-lg">
                  {profile.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {profile && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="max-w-16 truncate text-xs text-foreground">Your story</span>
          </button>
        )}

        {/* Story Items */}
        {storyUsers.map((storyUser) => (
          <Link
            key={storyUser.user_id}
            to={`/story/${storyUser.username}`}
            className="flex flex-shrink-0 flex-col items-center gap-1"
          >
            <div className="rounded-full p-0.5 gradient-instagram">
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={storyUser.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-lg">
                  {storyUser.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="max-w-16 truncate text-xs text-foreground">
              {storyUser.username}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StoryBar;
