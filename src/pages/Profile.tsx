import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, Grid3X3, Bookmark, ExternalLink, MessageCircle, Bell, Film, MoreHorizontal, BadgeCheck, UserPlus, Play } from 'lucide-react';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FollowersModal from '@/components/profile/FollowersModal';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  account_type: 'business' | 'shopper' | 'creator';
  website_url: string | null;
  store_category: string | null;
  is_verified?: boolean;
}

interface Post {
  id: string;
  image_url: string | null;
  caption: string | null;
  post_type?: 'text' | 'image' | 'video' | 'reel';
  likes_count?: number;
  comments_count?: number;
}

interface Reel {
  id: string;
  thumbnail_url: string | null;
  video_url: string;
  views_count?: number;
}

interface MutualFollower {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([]);
  const [hasActiveStories, setHasActiveStories] = useState(false);

  const isOwnProfile = currentUserProfile?.username === username;
  const isWain2020 = profile?.username?.toLowerCase() === '@wain2020';
  const canMessage = !isOwnProfile && user && (profile?.account_type === 'business' || profile?.account_type === 'creator');

  useEffect(() => {
    if (username) {
      // Normalize username: ensure it starts with @ and is lowercase
      const normalizedUsername = username.startsWith('@') 
        ? username.toLowerCase() 
        : `@${username.toLowerCase()}`;
      fetchProfile(normalizedUsername);
    }
  }, [username, user]);

  const fetchProfile = async (normalizedUsername: string) => {
    setLoading(true);

    console.log('Fetching profile for username:', normalizedUsername);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      console.log('Username searched:', normalizedUsername);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    // Check for active stories
    const now = new Date().toISOString();
    const { data: storiesData } = await supabase
      .from('stories')
      .select('id')
      .eq('user_id', profileData.user_id)
      .gt('expires_at', now)
      .limit(1);
    
    setHasActiveStories(storiesData && storiesData.length > 0);

    // Fetch posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, image_url, caption, post_type')
      .eq('user_id', profileData.user_id)
      .order('created_at', { ascending: false });

    setPosts(postsData || []);

    // Fetch reels
    const { data: reelsData } = await supabase
      .from('reels')
      .select('id, thumbnail_url, video_url')
      .eq('user_id', profileData.user_id)
      .order('created_at', { ascending: false });

    setReels(reelsData || []);

    // Fetch counts
    const [followersResult, followingResult] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', profileData.user_id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', profileData.user_id),
    ]);

    setFollowersCount(followersResult.count || 0);
    setFollowingCount(followingResult.count || 0);

    // Check if current user is following
    if (user && user.id !== profileData.user_id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileData.user_id)
        .maybeSingle();
      
      setIsFollowing(!!followData);

      // Fetch mutual followers (people who follow both you and this profile)
      // First get the IDs of people current user follows
      const { data: currentUserFollowing } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (currentUserFollowing && currentUserFollowing.length > 0) {
        const followingIds = currentUserFollowing.map(f => f.following_id);

        // Then find mutual followers
        const { data: mutualData } = await supabase
          .from('follows')
          .select(`
            follower:profiles!follows_follower_id_fkey(
              id,
              user_id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('following_id', profileData.user_id)
          .in('follower_id', followingIds)
          .limit(3);

        if (mutualData && mutualData.length > 0) {
          setMutualFollowers(
            mutualData
              .map((m: any) => m.follower)
              .filter(Boolean)
              .slice(0, 3)
          );
        }
      }
    }

    // Fetch saved posts if own profile
    if (currentUserProfile?.username === username && user) {
      const { data: savedData } = await supabase
        .from('saved_posts')
        .select('posts(id, image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedPosts(
        (savedData || [])
          .map((s: any) => s.posts)
          .filter(Boolean) as Post[]
      );
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.user_id);
      
      setIsFollowing(false);
      setFollowersCount(followersCount - 1);
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profile.user_id,
      });

      // Create notification
      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        type: 'follow',
        actor_id: user.id,
      });
      
      setIsFollowing(true);
      setFollowersCount(followersCount + 1);
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    navigate(`/messages/new?to=${profile.user_id}`);
  };

  const handleShareProfile = () => {
    if (profile) {
      const profileUrl = `${window.location.origin}/profile/${profile.username}`;
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          toast({ title: 'Profile link copied to clipboard!' });
        })
        .catch((err) => {
          console.error('Failed to copy profile link:', err);
          toast({ title: 'Failed to copy profile link.', variant: 'destructive' });
        });
    }
  };

  const getAccountLabel = () => {
    switch (profile?.account_type) {
      case 'business':
        return profile.store_category || 'Business';
      case 'creator':
        return profile.store_category || 'Creator';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingLogo size="md" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="mt-2 text-muted-foreground">
            This user doesn't exist or has been removed.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          {profile.cover_url ? (
            <img
              src={profile.cover_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Edit Cover Button - Only visible on own profile */}
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/edit-profile')}
              className="absolute top-4 right-4 glass backdrop-blur-xl text-white hover:glass-strong"
            >
              <Camera className="h-4 w-4 mr-2" />
              Edit Cover
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <header className="relative px-4 md:px-8">
          {/* Avatar positioned to overlap cover */}
          <div className="relative -mt-16 md:-mt-20 mb-4">
            <div className="glass-strong p-2 rounded-full inline-block">
              {hasActiveStories ? (
                <Link to={`/story/${profile.username}`}>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                      <div className="h-full w-full rounded-full bg-background" />
                    </div>
                    <Avatar className="h-28 w-28 md:h-36 md:w-36 relative border-4 border-background">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-3xl md:text-4xl">
                        {profile.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
              ) : (
                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl md:text-4xl">
                    {profile.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="glass-card p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
                  {isWain2020 ? (
                <VerifiedBadge size="sm" />
              ) : (profile.account_type === 'business' || profile.account_type === 'creator' || profile.is_verified) && (
                <BadgeCheck className="h-5 w-5 text-primary fill-primary" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-start gap-6 md:gap-12">
            {/* Avatar with story indicator */}
            <div className="relative flex-shrink-0">
              {hasActiveStories ? (
                <button
                  onClick={() => navigate(`/story/${profile.username}`)}
                  className="relative block"
                >
                  {/* Neon gradient ring for active stories */}
                  <div className="relative p-[3px] bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-lime-400 rounded-full animate-pulse">
                    <div className="bg-background rounded-full p-[3px]">
                      <Avatar className="h-20 w-20 md:h-36 md:w-36">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl md:text-4xl bg-secondary">
                          {profile.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <Avatar className="h-20 w-20 md:h-36 md:w-36">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl md:text-4xl bg-secondary">
                      {profile.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Desktop username row */}
              <div className="hidden md:flex flex-wrap items-center gap-3 mb-5">
                <h1 className="text-xl font-normal">{profile.username.replace('@', '')}</h1>
                {isWain2020 ? (
                  <VerifiedBadge size="sm" />
                ) : (profile.account_type === 'business' || profile.account_type === 'creator' || profile.is_verified) && (
                  <BadgeCheck className="h-5 w-5 text-primary fill-primary" />
                )}
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="h-8 px-4 font-semibold" asChild>
                      <Link to="/settings">Edit profile</Link>
                    </Button>
                    <Button variant="secondary" size="sm" className="h-8 px-4 font-semibold" onClick={() => navigate('/settings')}>
                      View archive
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/settings')}>
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-6 font-semibold"
                      variant={isFollowing ? 'secondary' : 'default'}
                      onClick={handleFollow}
                      disabled={!user}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    {canMessage && (
                      <Button size="sm" variant="secondary" className="h-8 px-6 font-semibold" onClick={handleMessage}>
                        Message
                      </Button>
                    )}
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats - Desktop */}
              <div className="hidden md:flex gap-8 mb-5">
                <div>
                  <span className="font-semibold">{posts.length}</span>{' '}
                  <span className="text-muted-foreground">posts</span>
                </div>
                <button onClick={() => setShowFollowersModal(true)} className="hover:opacity-70 transition">
                  <span className="font-semibold">{followersCount.toLocaleString()}</span>{' '}
                  <span className="text-muted-foreground">followers</span>
                </button>
                <button onClick={() => setShowFollowingModal(true)} className="hover:opacity-70 transition">
                  <span className="font-semibold">{followingCount.toLocaleString()}</span>{' '}
                  <span className="text-muted-foreground">following</span>
                </button>
              </div>

              {/* Bio - Desktop */}
              <div className="hidden md:block space-y-1">
                <p className="font-semibold">{profile.display_name}</p>
                {getAccountLabel() && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {getAccountLabel()}
                  </Badge>
                )}
                {profile.bio && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {profile.bio.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < profile.bio!.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-70 transition"
                  >
                    {profile.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {/* Mutual followers */}
                {!isOwnProfile && mutualFollowers.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <div className="flex -space-x-2">
                      {mutualFollowers.slice(0, 2).map((follower) => (
                        <Avatar key={follower.id} className="h-5 w-5 border-2 border-background">
                          <AvatarImage src={follower.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {follower.display_name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs">
                      Followed by{' '}
                      <button className="font-semibold text-foreground hover:opacity-70">
                        {mutualFollowers[0].username.replace('@', '')}
                      </button>
                      {mutualFollowers.length > 1 && (
                        <>
                          {mutualFollowers.length === 2 ? (
                            <>
                              {' '}and{' '}
                              <button className="font-semibold text-foreground hover:opacity-70">
                                {mutualFollowers[1].username.replace('@', '')}
                              </button>
                            </>
                          ) : (
                            <>
                              {' '}, {' '}
                              <button className="font-semibold text-foreground hover:opacity-70">
                                {mutualFollowers[1].username.replace('@', '')}
                              </button>
                              {mutualFollowers.length > 2 && (
                                <span> + {mutualFollowers.length - 2} more</span>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio - Mobile */}
          <div className="mt-4 md:hidden space-y-1">
            <p className="font-semibold text-sm">{profile.display_name}</p>
            {getAccountLabel() && (
              <Badge variant="secondary" className="text-xs font-normal">
                {getAccountLabel()}
              </Badge>
            )}
            {profile.bio && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {profile.bio.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < profile.bio!.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-70"
              >
                {profile.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {/* Mutual followers - Mobile */}
            {!isOwnProfile && mutualFollowers.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  {mutualFollowers.slice(0, 2).map((follower) => (
                    <Avatar key={follower.id} className="h-4 w-4 border-2 border-background">
                      <AvatarImage src={follower.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {follower.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span>
                  Followed by{' '}
                  <span className="font-semibold text-foreground">
                    {mutualFollowers[0].username.replace('@', '')}
                  </span>
                  {mutualFollowers.length > 1 && (
                    <span> and {mutualFollowers.length - 1} other{mutualFollowers.length > 2 ? 's' : ''}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - Mobile */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4 md:hidden">
              <Button
                className="flex-1 h-8 font-semibold"
                variant={isFollowing ? 'secondary' : 'default'}
                onClick={handleFollow}
                disabled={!user}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              {canMessage && (
                <Button className="flex-1 h-8 font-semibold" variant="secondary" onClick={handleMessage}>
                  Message
                </Button>
              )}
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isOwnProfile && (
            <div className="flex gap-2 mt-4 md:hidden">
              <Button className="flex-1 h-8 font-semibold" variant="secondary" asChild>
                <Link to="/settings">Edit profile</Link>
              </Button>
              <Button className="flex-1 h-8 font-semibold" variant="secondary" onClick={handleShareProfile}>
                Share Profile
              </Button>
            </div>
          )}

          {/* Stats - Mobile */}
          <div className="mt-4 flex justify-around border-t border-b border-border py-3 md:hidden">
            <div className="text-center">
              <div className="font-semibold">{posts.length}</div>
              <div className="text-xs text-muted-foreground">posts</div>
            </div>
            <button onClick={() => setShowFollowersModal(true)} className="text-center">
              <div className="font-semibold">{followersCount}</div>
              <div className="text-xs text-muted-foreground">followers</div>
            </button>
            <button onClick={() => setShowFollowingModal(true)} className="text-center">
              <div className="font-semibold">{followingCount}</div>
              <div className="text-xs text-muted-foreground">following</div>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-center rounded-none border-t border-border bg-transparent h-12">
            <TabsTrigger value="posts" className="flex-1 gap-2 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex-1 gap-2 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Updates</span>
            </TabsTrigger>
            <TabsTrigger value="reels" className="flex-1 gap-2 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground">
              <Film className="h-4 w-4" />
              <span className="hidden sm:inline">Reels</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="flex-1 gap-2 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Saved</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {posts.filter(p => p.post_type !== 'text').length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.filter(p => p.post_type !== 'text').map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="relative aspect-square bg-secondary group overflow-hidden"
                  >
                    {post.post_type === 'video' ? (
                      <>
                        <video
                          src={post.image_url || undefined}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute top-2 right-2">
                          <Play className="h-5 w-5 text-white drop-shadow-lg" fill="white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={post.image_url || ''}
                        alt="Post"
                        className="h-full w-full object-cover transition group-hover:opacity-90"
                        loading="lazy"
                      />
                    )}
                    {/* Hover overlay with engagement stats */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white">
                      {post.likes_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span className="font-semibold">{post.likes_count}</span>
                        </div>
                      )}
                      {post.comments_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5" fill="white" />
                          <span className="font-semibold">{post.comments_count}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                  <Grid3X3 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold">No Posts Yet</h3>
                {isOwnProfile && (profile.account_type === 'business' || profile.account_type === 'creator') && (
                  <Button asChild className="mt-4">
                    <Link to="/create">Share your first post</Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="updates" className="mt-0">
            {posts.filter(p => p.post_type === 'text').length > 0 ? (
              <div className="divide-y divide-border">
                {posts.filter(p => p.post_type === 'text').map((post) => (
                  <div key={post.id} className="px-4 py-4 bg-secondary/30">
                    <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No Updates Yet</h3>
                {isOwnProfile && (
                  <p className="mt-2 text-muted-foreground">Share a text update to connect with your followers.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reels" className="mt-0">
            {reels.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {reels.map((reel) => (
                  <Link
                    key={reel.id}
                    to={`/reels/${reel.id}`}
                    className="relative aspect-[9/16] bg-secondary group overflow-hidden"
                  >
                    {reel.thumbnail_url ? (
                      <img
                        src={reel.thumbnail_url}
                        alt="Reel"
                        className="h-full w-full object-cover transition group-hover:opacity-90"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={reel.video_url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white drop-shadow-lg">
                      <Play className="h-4 w-4" fill="white" />
                      {reel.views_count !== undefined && (
                        <span className="text-xs font-semibold">{reel.views_count.toLocaleString()}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                  <Film className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold">No Reels Yet</h3>
                {isOwnProfile && (profile.account_type === 'business' || profile.account_type === 'creator') && (
                  <Button asChild className="mt-4">
                    <Link to="/create-reel">Share your first reel</Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              {savedPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {savedPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      className="relative aspect-square bg-secondary"
                    >
                      <img
                        src={post.image_url}
                        alt="Saved post"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bookmark className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No Saved Posts</h3>
                  <p className="mt-2 text-muted-foreground">
                    Save posts to view them here later.
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Followers/Following Modals */}
        {profile && (
          <>
            <FollowersModal
              open={showFollowersModal}
              onOpenChange={setShowFollowersModal}
              userId={profile.user_id}
              type="followers"
              username={profile.username}
            />
            <FollowersModal
              open={showFollowingModal}
              onOpenChange={setShowFollowingModal}
              userId={profile.user_id}
              type="following"
              username={profile.username}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;
