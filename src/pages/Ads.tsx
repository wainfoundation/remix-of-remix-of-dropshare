import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, Eye, MousePointer, Coins, BarChart3, Play, Pause, Trash2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ad_type: string;
  status: string;
  budget_pi: number;
  spent_pi: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

const Ads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    activeAds: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAds();
    }
  }, [user]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(data || []);

      // Calculate stats
      const totalSpent = data?.reduce((sum, ad) => sum + Number(ad.spent_pi), 0) || 0;
      const totalImpressions = data?.reduce((sum, ad) => sum + ad.impressions, 0) || 0;
      const totalClicks = data?.reduce((sum, ad) => sum + ad.clicks, 0) || 0;
      const activeAds = data?.filter((ad) => ad.status === 'active').length || 0;

      setStats({ totalSpent, totalImpressions, totalClicks, activeAds });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdStatus = async (ad: Ad) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', ad.id);

      if (error) throw error;

      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, status: newStatus } : a))
      );

      toast({
        title: 'Success',
        description: `Ad ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      const { error } = await supabase.from('ads').delete().eq('id', adId);

      if (error) throw error;

      setAds((prev) => prev.filter((a) => a.id !== adId));
      toast({
        title: 'Success',
        description: 'Ad deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to manage ads</h2>
          <Button onClick={() => navigate('/login')} className="mt-6">
            Log In
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">DropShare Ads</h1>
          </div>
          <Button size="sm" onClick={() => navigate('/ads/create')}>
            <Plus className="h-4 w-4 mr-1" />
            Create Ad
          </Button>
        </header>

        <div className="p-4 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Coins className="h-4 w-4" />
                  <span className="text-xs">Spent</span>
                </div>
                <p className="text-xl font-bold">{stats.totalSpent.toFixed(4)} π</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">Impressions</span>
                </div>
                <p className="text-xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MousePointer className="h-4 w-4" />
                  <span className="text-xs">Clicks</span>
                </div>
                <p className="text-xl font-bold">{stats.totalClicks.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Active</span>
                </div>
                <p className="text-xl font-bold">{stats.activeAds}</p>
              </CardContent>
            </Card>
          </div>

          {/* Ads List */}
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : ads.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No ads yet</h3>
                    <p className="text-muted-foreground text-sm mb-4 text-center">
                      Create your first ad to reach more pioneers
                    </p>
                    <Button onClick={() => navigate('/ads/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Ad
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                ads.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    onToggle={() => toggleAdStatus(ad)}
                    onDelete={() => deleteAd(ad.id)}
                    onEdit={() => navigate(`/ads/edit/${ad.id}`)}
                    statusColor={getStatusColor(ad.status)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-4">
              {ads.filter((a) => a.status === 'active').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active ads</div>
              ) : (
                ads
                  .filter((a) => a.status === 'active')
                  .map((ad) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      onToggle={() => toggleAdStatus(ad)}
                      onDelete={() => deleteAd(ad.id)}
                      onEdit={() => navigate(`/ads/edit/${ad.id}`)}
                      statusColor={getStatusColor(ad.status)}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="paused" className="space-y-4 mt-4">
              {ads.filter((a) => a.status === 'paused').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No paused ads</div>
              ) : (
                ads
                  .filter((a) => a.status === 'paused')
                  .map((ad) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      onToggle={() => toggleAdStatus(ad)}
                      onDelete={() => deleteAd(ad.id)}
                      onEdit={() => navigate(`/ads/edit/${ad.id}`)}
                      statusColor={getStatusColor(ad.status)}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="draft" className="space-y-4 mt-4">
              {ads.filter((a) => a.status === 'draft').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No drafts</div>
              ) : (
                ads
                  .filter((a) => a.status === 'draft')
                  .map((ad) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      onToggle={() => toggleAdStatus(ad)}
                      onDelete={() => deleteAd(ad.id)}
                      onEdit={() => navigate(`/ads/edit/${ad.id}`)}
                      statusColor={getStatusColor(ad.status)}
                    />
                  ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

interface AdCardProps {
  ad: Ad;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  statusColor: string;
}

const AdCard = ({ ad, onToggle, onDelete, onEdit, statusColor }: AdCardProps) => {
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Ad Preview */}
          {ad.image_url && (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ad Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{ad.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {ad.description || 'No description'}
                </p>
              </div>
              <Badge variant="outline" className={statusColor}>
                {ad.status}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Spent:</span>{' '}
                <span className="font-medium">{Number(ad.spent_pi).toFixed(4)} π</span>
              </div>
              <div>
                <span className="text-muted-foreground">Views:</span>{' '}
                <span className="font-medium">{ad.impressions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">CTR:</span>{' '}
                <span className="font-medium">{ctr}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-border">
          <button
            onClick={onToggle}
            className="flex-1 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            {ad.status === 'active' ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Activate
              </>
            )}
          </button>
          <div className="w-px bg-border" />
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Edit
          </button>
          <div className="w-px bg-border" />
          <button
            onClick={onDelete}
            className="flex-1 py-2.5 text-sm font-medium hover:bg-muted transition-colors text-destructive flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Ads;