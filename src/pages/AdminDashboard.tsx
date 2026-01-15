import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Users,
  Flag,
  Megaphone,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingAds: number;
  activeAds: number;
  todaySignups: number;
  monthlyActiveUsers: number;
  engagementRate: number;
}

interface ReportItem {
  id: string;
  content_type: 'post' | 'user' | 'comment' | 'ad';
  content_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: {
    username: string;
    display_name: string;
  };
}

interface AdItem {
  id: string;
  title: string;
  description: string | null;
  ad_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paused';
  budget_pi: number;
  created_at: string;
  advertiser: {
    username: string;
    display_name: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    pendingAds: 0,
    activeAds: 0,
    todaySignups: 0,
    monthlyActiveUsers: 0,
    engagementRate: 0
  });
  
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (!profile) return;
    
    // Only allow specific admin email access
    const isAdmin = profile?.username === 'admin' || profile?.username === 'mrwain';
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
    fetchAdminData();
  }, [profile]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await fetchStats();
      await fetchReports();
      await fetchPendingAds();
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todaySignupsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: mauCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      // Get local reports count
      const localReports = JSON.parse(localStorage.getItem('content_reports') || '[]');
      const pendingReports = localReports.filter((r: any) => r.status === 'pending').length;

      setStats({
        totalUsers: usersCount || 0,
        totalPosts: postsCount || 0,
        totalReports: pendingReports,
        pendingAds: 0,
        activeAds: 0,
        todaySignups: todaySignupsCount || 0,
        monthlyActiveUsers: mauCount || 0,
        engagementRate: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = async () => {
    try {
      // Get reports from localStorage
      const localReports = JSON.parse(localStorage.getItem('content_reports') || '[]');
      setReports(localReports.map((report: any) => ({
        ...report,
        reporter: { username: 'User', display_name: 'User' }
      })));
      
      const pendingReports = localReports.filter((r: any) => r.status === 'pending').length;
      setStats(prev => ({ ...prev, totalReports: pendingReports }));
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchPendingAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, ad_type, status, budget_pi, created_at, user_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data?.map(ad => ad.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const formattedAds: AdItem[] = (data || []).map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        ad_type: ad.ad_type,
        status: ad.status as AdItem['status'],
        budget_pi: ad.budget_pi,
        created_at: ad.created_at,
        advertiser: profileMap.get(ad.user_id) || { username: 'Unknown', display_name: 'Unknown' }
      }));
      
      setAds(formattedAds);
      
      const pending = formattedAds.filter(ad => ad.status === 'pending').length;
      const active = formattedAds.filter(ad => ad.status === 'active').length;
      
      setStats(prev => ({ ...prev, pendingAds: pending, activeAds: active }));
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss') => {
    try {
      // Update local storage reports
      const localReports = JSON.parse(localStorage.getItem('content_reports') || '[]');
      const updatedReports = localReports.map((r: any) => 
        r.id === reportId ? { ...r, status: action === 'approve' ? 'resolved' : 'dismissed' } : r
      );
      localStorage.setItem('content_reports', JSON.stringify(updatedReports));

      toast({
        title: "Report Updated",
        description: `Report has been ${action === 'approve' ? 'approved' : 'dismissed'}.`,
      });

      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report.",
        variant: "destructive"
      });
    }
  };

  const handleAdAction = async (adId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Ad Updated",
        description: `Ad has been ${action}d.`,
      });

      fetchPendingAds();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast({
        title: "Error",
        description: "Failed to update ad.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingLogo size="xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <BarChart3 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.todaySignups} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.engagementRate}% engagement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                Requires review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ad Approvals</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingAds}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeAds} active ads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="ads">Ad Approvals</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.filter(r => r.status === 'pending').map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.content_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Reported by @{report.reporter.username}
                          </span>
                        </div>
                        <p className="font-medium">{report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReportAction(report.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Take Action
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                  {reports.filter(r => r.status === 'pending').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No pending reports</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ad Approval Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ads.filter(ad => ad.status === 'pending').map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{ad.ad_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by @{ad.advertiser.username}
                          </span>
                        </div>
                        <p className="font-medium">{ad.title}</p>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                        )}
                        <p className="text-sm font-medium mt-2">
                          Budget: {ad.budget_pi} π
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAdAction(ad.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAdAction(ad.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {ads.filter(ad => ad.status === 'pending').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No pending ads</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.monthlyActiveUsers.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Today's Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{stats.todaySignups}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
