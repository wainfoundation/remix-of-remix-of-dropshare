import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationSettings from '@/components/NotificationSettings';

interface SuggestedUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'business' | 'shopper' | 'creator';
  follower_count: number;
  is_following: boolean;
}

interface TrendingHashtag {
  id: string;
  tag: string;
  post_count: number;
}

interface RightSidebarProps {
  mobile?: boolean;
}

const RightSidebar = ({ mobile = false }: RightSidebarProps) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestions();
    fetchTrending();
  }, [user]);

  const fetchSuggestions = async () => {
    // Get random users excluding current user
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, account_type')
      .limit(5);

    if (!profilesData) {
      setLoading(false);
      return;
    }

    // Get follower counts
    const userIds = profilesData.map((p) => p.user_id);
    const { data: followCounts } = await supabase
      .from('follows')
      .select('following_id')
      .in('following_id', userIds);

    const followerCountMap = (followCounts || []).reduce((acc, f) => {
      acc[f.following_id] = (acc[f.following_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check if current user is following
    let followingMap: Record<string, boolean> = {};
    if (user) {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);

      followingMap = (followingData || []).reduce((acc, f) => {
        acc[f.following_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    const enriched = profilesData
      .filter((p) => p.user_id !== user?.id)
      .map((profile) => ({
        ...profile,
        is_following: followingMap[profile.user_id] || false,
        follower_count: followerCountMap[profile.user_id] || 0,
      }))
      .slice(0, 5);

    setSuggestions(enriched);
    setLoading(false);
  };

  const fetchTrending = async () => {
    // Use loose typing until generated types include hashtags table
    const { data } = await supabase
      .from('hashtags' as any)
      .select('id, tag, post_count')
      .gt('post_count', 0)
      .order('post_count', { ascending: false })
      .limit(3);

    setTrending(((data as any[]) || []) as TrendingHashtag[]);
  };

  const handleFollow = async (profileUserId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const profile = suggestions.find((p) => p.user_id === profileUserId);
    if (!profile) return;

    if (profile.is_following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileUserId);
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profileUserId,
      });
    }

    setSuggestions((prev) =>
      prev.map((p) =>
        p.user_id === profileUserId
          ? { ...p, is_following: !p.is_following, follower_count: p.is_following ? p.follower_count - 1 : p.follower_count + 1 }
          : p
      )
    );
  };

  return (
    <div className={cn(
      "w-80 xl:w-96 p-4 space-y-4 overflow-y-auto",
      mobile ? "pt-16 h-full" : "hidden lg:block sticky top-4 h-screen"
    )}>
      {/* Notification Settings */}
      {user && <NotificationSettings />}
      
      {/* Who to Follow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Who to Follow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-2 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((profile) => (
              <div key={profile.user_id} className="flex items-center gap-3">
                <Avatar
                  className="h-10 w-10 cursor-pointer"
                  onClick={() => navigate(`/profile/${profile.username}`)}
                >
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback>
                    {profile.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/profile/${profile.username}`)}
                    className="font-semibold text-sm hover:underline truncate block text-left"
                  >
                    {profile.display_name}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.username}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={profile.is_following ? 'outline' : 'default'}
                  onClick={() => handleFollow(profile.user_id)}
                  className="shrink-0 h-8"
                >
                  {profile.is_following ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No suggestions available
            </p>
          )}
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={() => navigate('/pioneer')}
          >
            See more
          </Button>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trending.length > 0 ? (
            trending.map((hashtag) => (
              <button
                key={hashtag.id}
                onClick={() => navigate('/trending')}
                className="text-sm w-full text-left hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <p className="font-semibold">#{hashtag.tag}</p>
                <p className="text-xs text-muted-foreground">
                  {hashtag.post_count.toLocaleString()} posts
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trending topics yet
            </p>
          )}
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={() => navigate('/trending')}
          >
            Show more
          </Button>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <div className="text-xs text-muted-foreground space-y-2 px-4 pb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/help" className="hover:underline">Help</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/developers" className="hover:underline">Developers</Link>
          <Link to="/cookies" className="hover:underline">Cookies</Link>
          <Link to="/careers" className="hover:underline">Careers</Link>
          <Link to="/advertising" className="hover:underline">Advertising</Link>
        </div>
        <p className="text-xs">© 2026 DropShare by Mrwain Organization</p>
      </div>
    </div>
  );
};

export default RightSidebar;
