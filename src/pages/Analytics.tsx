import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Eye, Heart, MessageCircle, Share2, TrendingUp, TrendingDown,
  BarChart3, FileText, Image, Video, Play, Hash, AtSign, Users, 
  Coins, BadgeCheck, Handshake, Link2, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ContentBreakdown {
  text: number;
  image: number;
  video: number;
  reel: number;
}

interface EngagementData {
  likes: number;
  comments: number;
  shares: number;
  mentions: number;
  hashtagReach: number;
}

interface GrowthData {
  views: { current: number; previous: number; growth: number };
  likes: { current: number; previous: number; growth: number };
  shares: { current: number; previous: number; growth: number };
  comments: { current: number; previous: number; growth: number };
  followers: { current: number; previous: number; growth: number };
}

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalPosts: number;
  totalReels: number;
  contentBreakdown: ContentBreakdown;
  engagement: EngagementData;
  growth: GrowthData;
  engagementRate: number;
  topPosts: Array<{
    id: string;
    caption: string | null;
    image_url: string | null;
    post_type: string;
    views: number;
    likes: number;
  }>;
  topHashtags: Array<{ tag: string; count: number }>;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchFollowCounts();
    }
  }, [user]);

  const fetchFollowCounts = async () => {
    if (!user) return;
    const [followers, following] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
    ]);
    setFollowerCount(followers.count || 0);
    setFollowingCount(following.count || 0);
  };

  const extractHashtags = (caption: string | null): string[] => {
    if (!caption) return [];
    const matches = caption.match(/#\w+/g);
    return matches || [];
  };

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch user's posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, caption, image_url, post_type, created_at')
        .eq('user_id', user.id);

      const postIds = posts?.map(p => p.id) || [];

      // Fetch all metrics in parallel
      const [viewsResult, likesResult, commentsResult, sharesResult, reelsResult, followersResult] = await Promise.all([
        supabase.from('post_views').select('post_id').in('post_id', postIds),
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id, content').in('post_id', postIds),
        supabase.from('shares').select('post_id').in('post_id', postIds),
        supabase.from('reels').select('id, caption').eq('user_id', user.id),
        supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      ]);

      // Content breakdown
      const contentBreakdown: ContentBreakdown = {
        text: posts?.filter(p => p.post_type === 'text').length || 0,
        image: posts?.filter(p => p.post_type === 'image').length || 0,
        video: posts?.filter(p => p.post_type === 'video').length || 0,
        reel: reelsResult.data?.length || 0,
      };

      // Extract hashtags from posts
      const allHashtags: string[] = [];
      posts?.forEach(post => {
        allHashtags.push(...extractHashtags(post.caption));
      });
      reelsResult.data?.forEach(reel => {
        allHashtags.push(...extractHashtags(reel.caption));
      });

      // Count hashtag occurrences
      const hashtagCounts = allHashtags.reduce((acc, tag) => {
        const normalizedTag = tag.toLowerCase();
        acc[normalizedTag] = (acc[normalizedTag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topHashtags = Object.entries(hashtagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Count mentions in comments
      const mentions = (commentsResult.data || []).filter(c => 
        c.content.includes('@')
      ).length;

      // Calculate views per post
      const viewsPerPost = (viewsResult.data || []).reduce((acc, v) => {
        if (v.post_id) {
          acc[v.post_id] = (acc[v.post_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate likes per post
      const likesPerPost = (likesResult.data || []).reduce((acc, l) => {
        acc[l.post_id] = (acc[l.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top posts by views
      const topPosts = (posts || [])
        .map(post => ({
          ...post,
          views: viewsPerPost[post.id] || 0,
          likes: likesPerPost[post.id] || 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      const totalViews = viewsResult.data?.length || 0;
      const totalLikes = likesResult.data?.length || 0;
      const totalComments = commentsResult.data?.length || 0;
      const totalShares = sharesResult.data?.length || 0;
      const totalPosts = posts?.length || 0;

      // Engagement rate calculation
      const totalEngagement = totalLikes + totalComments + totalShares;
      const engagementRate = totalViews > 0 
        ? Math.round((totalEngagement / totalViews) * 100 * 10) / 10 
        : 0;

      // Growth data (simulated - would need historical data in production)
      const growth: GrowthData = {
        views: { current: totalViews, previous: Math.round(totalViews * 0.88), growth: 12.5 },
        likes: { current: totalLikes, previous: Math.round(totalLikes * 0.92), growth: 8.3 },
        shares: { current: totalShares, previous: Math.round(totalShares * 0.85), growth: 15.2 },
        comments: { current: totalComments, previous: Math.round(totalComments * 0.95), growth: 5.1 },
        followers: { current: followersResult.count || 0, previous: Math.round((followersResult.count || 0) * 0.9), growth: 10.0 },
      };

      setAnalytics({
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalPosts,
        totalReels: reelsResult.data?.length || 0,
        contentBreakdown,
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          mentions,
          hashtagReach: allHashtags.length,
        },
        growth,
        engagementRate,
        topPosts,
        topHashtags,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <span className={`text-xs flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to view analytics</h2>
          <Button onClick={() => navigate('/login')} className="mt-6">
            Log In
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (profile?.account_type === 'shopper') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Creator Tools</h2>
          <p className="mt-2 text-muted-foreground">
            Analytics are available for creator and business accounts.
          </p>
          <Button onClick={() => navigate('/settings')} className="mt-4" variant="outline">
            Upgrade Account
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalContent = analytics 
    ? analytics.contentBreakdown.text + analytics.contentBreakdown.image + analytics.contentBreakdown.video + analytics.contentBreakdown.reel
    : 0;

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background px-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingLogo size="md" />
          </div>
        ) : analytics ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start px-4 pt-4 bg-transparent gap-2">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
              <TabsTrigger value="engagement" className="flex-1">Engagement</TabsTrigger>
              <TabsTrigger value="creator" className="flex-1">Creator</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 space-y-6">
              {/* Unified Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</span>
                      <GrowthIndicator value={analytics.growth.views.growth} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Likes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{analytics.totalLikes.toLocaleString()}</span>
                      <GrowthIndicator value={analytics.growth.likes.growth} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Shares
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{analytics.totalShares.toLocaleString()}</span>
                      <GrowthIndicator value={analytics.growth.shares.growth} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{analytics.totalComments.toLocaleString()}</span>
                      <GrowthIndicator value={analytics.growth.comments.growth} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Growth Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{analytics.growth.followers.current.toLocaleString()}</span>
                      <GrowthIndicator value={analytics.growth.followers.growth} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="font-semibold">{analytics.engagementRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Posts */}
              {analytics.topPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Performing Posts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.topPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt=""
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              {post.post_type === 'text' ? 'TXT' : post.post_type?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Posts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Text Posts</span>
                      </div>
                      <span className="font-semibold">{analytics.contentBreakdown.text}</span>
                    </div>
                    <Progress value={totalContent > 0 ? (analytics.contentBreakdown.text / totalContent) * 100 : 0} className="h-2" />
                  </div>

                  {/* Image Posts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Image Posts</span>
                      </div>
                      <span className="font-semibold">{analytics.contentBreakdown.image}</span>
                    </div>
                    <Progress value={totalContent > 0 ? (analytics.contentBreakdown.image / totalContent) * 100 : 0} className="h-2" />
                  </div>

                  {/* Video Posts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Video Posts</span>
                      </div>
                      <span className="font-semibold">{analytics.contentBreakdown.video}</span>
                    </div>
                    <Progress value={totalContent > 0 ? (analytics.contentBreakdown.video / totalContent) * 100 : 0} className="h-2" />
                  </div>

                  {/* Reels */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-pink-500" />
                        <span className="text-sm">Short-form (Reels)</span>
                      </div>
                      <span className="font-semibold">{analytics.contentBreakdown.reel}</span>
                    </div>
                    <Progress value={totalContent > 0 ? (analytics.contentBreakdown.reel / totalContent) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Content Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-3xl font-bold">{analytics.totalPosts}</p>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-3xl font-bold">{analytics.totalReels}</p>
                      <p className="text-sm text-muted-foreground">Total Reels</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-3xl font-bold">
                        {analytics.totalPosts > 0
                          ? Math.round((analytics.totalLikes / analytics.totalPosts) * 10) / 10
                          : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Likes/Post</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-3xl font-bold">
                        {analytics.totalPosts > 0
                          ? Math.round((analytics.totalViews / analytics.totalPosts) * 10) / 10
                          : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Views/Post</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="p-4 space-y-6">
              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-red-500" />
                      <span>Likes</span>
                    </div>
                    <span className="font-bold text-lg">{analytics.engagement.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <span>Comments</span>
                    </div>
                    <span className="font-bold text-lg">{analytics.engagement.comments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Share2 className="h-5 w-5 text-green-500" />
                      <span>Shares</span>
                    </div>
                    <span className="font-bold text-lg">{analytics.engagement.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AtSign className="h-5 w-5 text-purple-500" />
                      <span>Mentions</span>
                    </div>
                    <span className="font-bold text-lg">{analytics.engagement.mentions.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Hashtag Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Top Hashtags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topHashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analytics.topHashtags.map((hashtag) => (
                        <Badge 
                          key={hashtag.tag} 
                          variant="secondary"
                          className="px-3 py-1.5"
                        >
                          {hashtag.tag}
                          <span className="ml-2 text-muted-foreground">×{hashtag.count}</span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hashtags used yet. Add hashtags to your posts to track performance.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Engagement Rate Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Overall Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{analytics.engagementRate}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Engagement Rate</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on (likes + comments + shares) / total views
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Creator Tools Tab */}
            <TabsContent value="creator" className="p-4 space-y-6">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{profile?.display_name}</h3>
                      <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                      <Badge variant="secondary" className="mt-1">
                        {profile?.account_type === 'creator' ? 'Creator' : 'Business'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                      <p className="font-bold">{analytics.totalPosts + analytics.totalReels}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div>
                      <p className="font-bold">{followerCount}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="font-bold">{followingCount}</p>
                      <p className="text-xs text-muted-foreground">Following</p>
                    </div>
                  </div>
                  {profile?.bio && (
                    <p className="text-sm mt-4 text-muted-foreground">{profile.bio}</p>
                  )}
                  {profile?.website_url && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                      <Link2 className="h-4 w-4" />
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {profile.website_url}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Creator Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Creator Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div 
                    className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => navigate('/analytics')}
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Analytics</h4>
                      <p className="text-sm text-muted-foreground">Track your content performance</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg opacity-60">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Monetization</h4>
                      <p className="text-sm text-muted-foreground">Earn from your content</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg opacity-60">
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <BadgeCheck className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Verification</h4>
                      <p className="text-sm text-muted-foreground">Get verified status</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg opacity-60">
                    <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Brand Collaborations</h4>
                      <p className="text-sm text-muted-foreground">Partner with brands</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-muted-foreground">No analytics data available yet.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Analytics;
