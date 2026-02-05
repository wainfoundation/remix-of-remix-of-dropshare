 import { useEffect, useState, FormEvent } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, BarChart3, Flag, CheckCircle, XCircle, 
  AlertTriangle, Shield, Coins, Activity, 
  FileText, ArrowLeft
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { LoadingLogo } from '@/components/ui/loading-logo';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalAds: number;
  pendingReports: number;
  pendingAds: number;
  totalRevenue: number;
  dailyActiveUsers: number;
}

interface PendingAd {
  id: string;
  title: string;
  description: string;
  image_url: string;
  advertiser: string;
  budget_pi: number;
  created_at: string;
  status: string;
}

interface Report {
  id: string;
  content_type: 'post' | 'user' | 'comment';
  content_id: string;
  reporter_username: string;
  reason: string;
  description: string;
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

interface UserActivity {
  id: string;
  username: string;
  display_name: string;
  account_type: string;
  posts_count: number;
  followers_count: number;
  last_active: string;
  status: 'active' | 'suspended' | 'banned';
}

const Admin = () => {
  const navigate = useNavigate();
   const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
   const [isSigningIn, setIsSigningIn] = useState(false);
   const [isSigningUp, setIsSigningUp] = useState(false);
   const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [adminSession, setAdminSession] = useState<boolean>(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalAds: 0,
    pendingReports: 0,
    pendingAds: 0,
    totalRevenue: 0,
    dailyActiveUsers: 0,
  });
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserActivity[]>([]);

   // Check if user is admin (email-based auth only)
  useEffect(() => {
     const checkAdminSession = async () => {
       // Check Supabase session for email-based admin
       const { data: { session } } = await supabase.auth.getSession();
       
       if (session?.user?.email === 'sibiyagaming@gmail.com') {
         setAdminSession(true);
         fetchAdminData();
       } else {
         setAdminSession(false);
         setLoading(false);
       }
     };
 
     checkAdminSession();
 
     // Listen for auth changes
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
       if (session?.user?.email === 'sibiyagaming@gmail.com') {
         setAdminSession(true);
         fetchAdminData();
       } else {
         setAdminSession(false);
         setLoading(false);
       }
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const handleEmailSignIn = async (e: FormEvent) => {
     e.preventDefault();
     setIsSigningIn(true);
     
     try {
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
 
       if (error) {
         toast({
           title: "Sign In Failed",
           description: error.message,
           variant: "destructive",
         });
         return;
       }
 
       if (data.user?.email !== 'sibiyagaming@gmail.com') {
         await supabase.auth.signOut();
         toast({
           title: "Access Denied",
           description: "This admin panel is restricted.",
           variant: "destructive",
         });
         return;
       }
 
       toast({
         title: "Welcome Admin!",
         description: "You have successfully signed in.",
       });
       
       setAdminSession(true);
       fetchAdminData();
     } catch (error) {
       toast({
         title: "Error",
         description: "An unexpected error occurred.",
         variant: "destructive",
       });
     } finally {
       setIsSigningIn(false);
    }
   };
 
   const handleEmailSignUp = async (e: FormEvent) => {
     e.preventDefault();
     setIsSigningUp(true);
     
     try {
       if (email !== 'sibiyagaming@gmail.com') {
         toast({
           title: "Registration Restricted",
           description: "Admin registration is by invitation only.",
           variant: "destructive",
         });
         return;
       }
 
       const { data, error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           emailRedirectTo: `${window.location.origin}/admin`,
         },
       });
 
       if (error) {
         toast({
           title: "Sign Up Failed",
           description: error.message,
           variant: "destructive",
         });
         return;
       }
 
       toast({
         title: "Check Your Email",
         description: "Please verify your email to complete registration.",
       });
     } catch (error) {
       toast({
         title: "Error",
         description: "An unexpected error occurred.",
         variant: "destructive",
       });
     } finally {
       setIsSigningUp(false);
     }
   };
 
   const handleAdminSignOut = async () => {
     await supabase.auth.signOut();
     setAdminSession(false);
     setEmail('');
     setPassword('');
   };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchPendingAds(),
        fetchReports(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
   
   // Show auth form if not signed in as admin
   if (!adminSession && !loading) {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-background">
         <div className="w-full max-w-md space-y-6">
           <div className="text-center space-y-2">
             <div className="flex justify-center mb-4">
               <Shield className="h-16 w-16 text-primary" />
             </div>
             <h1 className="text-3xl font-bold">Admin Portal</h1>
             <p className="text-muted-foreground">
               Secure access for administrators only
             </p>
           </div>
 
           <Card>
             <CardHeader className="text-center pb-4">
               <CardTitle>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
             </CardHeader>
             <CardContent>
               <form onSubmit={authMode === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="email">Email</Label>
                   <Input
                     id="email"
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="admin@example.com"
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="password">Password</Label>
                   <Input
                     id="password"
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••"
                     required
                     minLength={6}
                   />
                 </div>
                 <Button 
                   type="submit" 
                   className="w-full" 
                   disabled={isSigningIn || isSigningUp}
                 >
                   {isSigningIn || isSigningUp ? (
                     <LoadingLogo size="sm" />
                   ) : authMode === 'signin' ? (
                     'Sign In'
                   ) : (
                     'Sign Up'
                   )}
                 </Button>
               </form>
 
               <div className="mt-4 text-center">
                 <button
                   type="button"
                   onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                   className="text-sm text-primary hover:underline"
                 >
                   {authMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                 </button>
               </div>
             </CardContent>
           </Card>
 
           <div className="text-center">
             <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
               ← Back to DropShare
             </Link>
           </div>
         </div>
       </div>
     );
   }

  const fetchStats = async () => {
    const [
      { count: totalUsers },
      { count: totalPosts },
      { count: totalAds },
      { count: pendingAds }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    // Get local reports count
    const localReports = JSON.parse(localStorage.getItem('content_reports') || '[]');
    const pendingReports = localReports.filter((r: any) => r.status === 'pending').length;

    // Calculate revenue from approved ads
    const { data: approvedAds } = await supabase
      .from('ads')
      .select('budget_pi')
      .eq('status', 'approved');

    const totalRevenue = approvedAds?.reduce((sum, ad) => sum + ad.budget_pi, 0) || 0;

    setStats({
      totalUsers: totalUsers || 0,
      activeUsers: Math.floor((totalUsers || 0) * 0.7),
      totalPosts: totalPosts || 0,
      totalAds: totalAds || 0,
      pendingReports,
      pendingAds: pendingAds || 0,
      totalRevenue,
      dailyActiveUsers: Math.floor((totalUsers || 0) * 0.3),
    });
  };

  const fetchPendingAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('id, title, description, image_url, budget_pi, created_at, status, user_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(ad => ad.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      
      setPendingAds(data.map(ad => ({
        ...ad,
        advertiser: profileMap.get(ad.user_id) || 'Unknown'
      })));
    }
  };

  const fetchReports = async () => {
    // Get reports from localStorage
    const localReports = JSON.parse(localStorage.getItem('content_reports') || '[]');
    setReports(localReports.map((report: any) => ({
      ...report,
      reporter_username: 'User'
    })));
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, display_name, account_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setUsers(data.map(user => ({
        ...user,
        posts_count: 0,
        followers_count: 0,
        last_active: new Date().toISOString(),
        status: 'active' as const
      })));
    }
  };

  const approveAd = async (adId: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: 'approved' })
      .eq('id', adId);

    if (!error) {
      toast({ title: "Success", description: "Ad approved successfully" });
      fetchPendingAds();
      fetchStats();
    } else {
      toast({ title: "Error", description: "Failed to approve ad", variant: "destructive" });
    }
  };

  const rejectAd = async (adId: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: 'rejected' })
      .eq('id', adId);

    if (!error) {
      toast({ title: "Success", description: "Ad rejected successfully" });
      fetchPendingAds();
      fetchStats();
    } else {
      toast({ title: "Error", description: "Failed to reject ad", variant: "destructive" });
    }
  };

  const resolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    // Update local storage reports
    const localReports = JSON.parse(localStorage.getItem('content_reports') || '[]');
    const updatedReports = localReports.map((r: any) => 
      r.id === reportId ? { ...r, status: action } : r
    );
    localStorage.setItem('content_reports', JSON.stringify(updatedReports));

    toast({ 
      title: "Success", 
      description: `Report ${action} successfully` 
    });
    fetchReports();
    fetchStats();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingLogo size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
               onClick={handleAdminSignOut}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users, content, and advertisements</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <Shield className="h-4 w-4 mr-1" />
            Admin Access
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(stats.totalUsers * 0.1)} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyActiveUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers > 0 ? ((stats.dailyActiveUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers > 0 ? (stats.totalPosts / stats.totalUsers).toFixed(1) : 0} posts per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ad Revenue</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} π</div>
              <p className="text-xs text-muted-foreground">
                From {stats.totalAds} total ads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Pending Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.pendingReports}
              </div>
              <p className="text-sm text-orange-700 mb-4">
                Reports requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                Pending Ad Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.pendingAds}
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Ads waiting for approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports ({stats.pendingReports})</TabsTrigger>
            <TabsTrigger value="ads">Ad Approval ({stats.pendingAds})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">5 new users registered today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">12 posts published in last hour</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">3 new reports submitted</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">User Engagement</span>
                    <span className="text-sm font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Content Quality</span>
                    <span className="text-sm font-medium text-green-600">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Report Resolution</span>
                    <span className="text-sm font-medium text-yellow-600">Needs Attention</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          {user.display_name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name}</p>
                          <p className="text-sm text-muted-foreground">{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={user.account_type === 'business' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {user.account_type}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-red-500" />
                  Content Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No pending reports
                    </p>
                  ) : (
                    reports.filter(r => r.status === 'pending').map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge variant="outline" className="mb-2">{report.content_type}</Badge>
                            <p className="font-medium">{report.reason}</p>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => resolveReport(report.id, 'resolved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => resolveReport(report.id, 'dismissed')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Ad Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingAds.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No pending ads to review
                    </p>
                  ) : (
                    pendingAds.map((ad) => (
                      <div key={ad.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{ad.title}</h4>
                            <p className="text-sm text-muted-foreground">{ad.description}</p>
                            <p className="text-sm mt-2">
                              <span className="font-medium">Budget:</span> {ad.budget_pi} π
                            </p>
                            <p className="text-xs text-muted-foreground">
                              By: {ad.advertiser}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => approveAd(ad.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectAd(ad.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
