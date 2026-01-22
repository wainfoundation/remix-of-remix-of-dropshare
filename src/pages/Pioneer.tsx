import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'business' | 'shopper' | 'creator';
  bio: string | null;
  is_following: boolean;
  follower_count: number;
}

const Pioneer = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(
        (profile) =>
          profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  }, [searchQuery, profiles]);

  const fetchProfiles = async () => {
    setLoading(true);

    // Fetch all profiles
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, account_type, bio')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      setLoading(false);
      return;
    }

    if (!profilesData || profilesData.length === 0) {
      setProfiles([]);
      setFilteredProfiles([]);
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

    // Check if current user is following these profiles
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

    const enrichedProfiles = profilesData.map((profile) => ({
      ...profile,
      is_following: followingMap[profile.user_id] || false,
      follower_count: followerCountMap[profile.user_id] || 0,
    }));

    // Filter out current user
    const filteredData = user
      ? enrichedProfiles.filter((p) => p.user_id !== user.id)
      : enrichedProfiles;

    setProfiles(filteredData);
    setFilteredProfiles(filteredData);
    setLoading(false);
  };

  const handleFollow = async (profileUserId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to follow users',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const profile = profiles.find((p) => p.user_id === profileUserId);
    if (!profile) return;

    if (profile.is_following) {
      // Unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileUserId);

      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === profileUserId
            ? { ...p, is_following: false, follower_count: p.follower_count - 1 }
            : p
        )
      );
    } else {
      // Follow
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profileUserId,
      });

      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === profileUserId
            ? { ...p, is_following: true, follower_count: p.follower_count + 1 }
            : p
        )
      );
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-white/10 glass backdrop-blur-xl">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold mb-3 text-white">Pioneer</h1>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <Input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 glass-subtle border-white/10 text-white placeholder:text-white/60"
              />
            </div>
          </div>
        </div>

        {/* Profiles List */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingLogo size="md" />
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="space-y-3">
              {filteredProfiles.map((profile) => (
                <Card key={profile.user_id} className="glass-card border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-14 w-14 cursor-pointer"
                        onClick={() => navigate(`/profile/${profile.username}`)}
                      >
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback>
                          {profile.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/profile/${profile.username}`)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {profile.display_name}
                          </p>
                          {profile.username.toLowerCase() === '@wain2020' && (
                            <VerifiedBadge size="sm" />
                          )}
                          {profile.account_type === 'business' && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              Business
                            </span>
                          )}
                          {profile.account_type === 'creator' && (
                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.username}
                        </p>
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {profile.bio}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {profile.follower_count} follower{profile.follower_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={profile.is_following ? 'outline' : 'default'}
                        onClick={() => handleFollow(profile.user_id)}
                        className="shrink-0"
                      >
                        {profile.is_following ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'No users to display'}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Pioneer;
