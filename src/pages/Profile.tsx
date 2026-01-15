import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, Grid3X3, Bookmark, ExternalLink, MessageCircle, Bell, Film, MoreHorizontal } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FollowersModal from '@/components/profile/FollowersModal';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  account_type: 'business' | 'shopper' | 'creator';
  website_url: string | null;
  store_category: string | null;
}

interface Post {
  id: string;
  image_url: string | null;
  caption: string | null;
  post_type?: 'text' | 'image' | 'video' | 'reel';
}

interface Reel {
  id: string;
  thumbnail_url: string | null;
  video_url: string;
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

  const isOwnProfile = currentUserProfile?.username === username;
  const canMessage = !isOwnProfile && user && (profile?.account_type === 'business' || profile?.account_type === 'creator');

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, user]);

  const fetchProfile = async () => {
    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

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
        {/* Profile Header */}
        <header className="px-4 py-6 md:px-8">
          {/* Mobile header row */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h1 className="text-xl font-semibold">{profile.username}</h1>
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
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 md:h-36 md:w-36 flex-shrink-0 ring-2 ring-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl md:text-4xl bg-secondary">
                  {profile.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(profile.account_type === 'business' || profile.account_type === 'creator') && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Desktop username row */}
              <div className="hidden md:flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-xl font-medium">{profile.username}</h1>
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link to="/settings">Edit Profile</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/settings')}>
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isFollowing ? 'secondary' : 'default'}
                      onClick={handleFollow}
                      disabled={!user}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    {canMessage && (
                      <Button size="sm" variant="secondary" onClick={handleMessage}>
                        Message
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats - Desktop */}
              <div className="hidden md:flex gap-8 mb-4">
                <div>
                  <span className="font-semibold">{posts.length}</span>{' '}
                  <span className="text-muted-foreground">posts</span>
                </div>
                <button onClick={() => setShowFollowersModal(true)} className="hover:underline">
                  <span className="font-semibold">{followersCount}</span>{' '}
                  <span className="text-muted-foreground">followers</span>
                </button>
                <button onClick={() => setShowFollowingModal(true)} className="hover:underline">
                  <span className="font-semibold">{followingCount}</span>{' '}
                  <span className="text-muted-foreground">following</span>
                </button>
              </div>

              {/* Bio - Desktop */}
              <div className="hidden md:block">
                <p className="font-semibold">{profile.display_name}</p>
                {getAccountLabel() && (
                  <p className="text-sm text-muted-foreground">{getAccountLabel()}</p>
                )}
                {profile.bio && <p className="mt-1 whitespace-pre-wrap">{profile.bio}</p>}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {profile.website_url.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio - Mobile */}
          <div className="mt-4 md:hidden">
            <p className="font-semibold">{profile.display_name}</p>
            {getAccountLabel() && (
              <p className="text-sm text-muted-foreground">{getAccountLabel()}</p>
            )}
            {profile.bio && <p className="mt-1 whitespace-pre-wrap text-sm">{profile.bio}</p>}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {profile.website_url.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Action buttons - Mobile */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4 md:hidden">
              <Button
                className="flex-1"
                variant={isFollowing ? 'secondary' : 'default'}
                onClick={handleFollow}
                disabled={!user}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              {canMessage && (
                <Button className="flex-1" variant="secondary" onClick={handleMessage}>
                  Message
                </Button>
              )}
            </div>
          )}
          {isOwnProfile && (
            <div className="flex gap-2 mt-4 md:hidden">
              <Button className="flex-1" variant="secondary" asChild>
                <Link to="/settings">Edit Profile</Link>
              </Button>
              <Button className="flex-1" variant="secondary" onClick={handleShareProfile}>
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
              <div className="grid grid-cols-3 gap-0.5">
                {posts.filter(p => p.post_type !== 'text').map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="relative aspect-square bg-secondary"
                  >
                    {post.post_type === 'video' ? (
                      <video
                        src={post.image_url || undefined}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={post.image_url || ''}
                        alt="Post"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Grid3X3 className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No Posts Yet</h3>
                {isOwnProfile && (profile.account_type === 'business' || profile.account_type === 'creator') && (
                  <Button asChild className="mt-4">
                    <Link to="/create">Create Your First Post</Link>
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
              <div className="grid grid-cols-3 gap-0.5">
                {reels.map((reel) => (
                  <Link
                    key={reel.id}
                    to={`/reels/${reel.id}`}
                    className="relative aspect-[9/16] bg-secondary"
                  >
                    {reel.thumbnail_url ? (
                      <img
                        src={reel.thumbnail_url}
                        alt="Reel"
                        className="h-full w-full object-cover"
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
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                      <Film className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Film className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No Reels Yet</h3>
                {isOwnProfile && (profile.account_type === 'business' || profile.account_type === 'creator') && (
                  <Button asChild className="mt-4">
                    <Link to="/create-reel">Create Your First Reel</Link>
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
