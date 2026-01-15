import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, Crown, Database, Users, Settings, BarChart3, 
  Key, Mail, Lock, AlertTriangle, CheckCircle, X,
  Server, Activity, Zap, Globe, Smartphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminMrwain = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    activeUsers: 0,
  });
  const [systemStatus, setSystemStatus] = useState({
    database: 'online',
    storage: 'online',
    auth: 'online',
    realtime: 'online',
  });

  // Check if user has admin access - Only allow specific admin email
  const isAuthorized = user?.email === 'sibiyagaming@gmail.com' || profile?.email === 'sibiyagaming@gmail.com';

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        title: "🚫 Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    fetchStats();
    checkSystemStatus();
  }, [isAuthorized, navigate]);

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get total likes
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true });

      // Get total comments
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      // Get active users (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: activeUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', yesterday.toISOString());

      setStats({
        totalUsers: usersCount || 0,
        totalPosts: postsCount || 0,
        totalLikes: likesCount || 0,
        totalComments: commentsCount || 0,
        activeUsers: activeUsersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check database
      await supabase.from('profiles').select('count').limit(1);
      
      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      
      setSystemStatus({
        database: 'online',
        storage: 'online',
        auth: session ? 'online' : 'warning',
        realtime: 'online',
      });
    } catch (error) {
      console.error('System check failed:', error);
      setSystemStatus(prev => ({
        ...prev,
        database: 'error',
      }));
    }
  };

  const handleDatabaseAction = async (action: string) => {
    try {
      if (action === 'cleanup') {
        // Example cleanup action
        const { error } = await supabase
          .from('posts')
          .delete()
          .is('image_url', null)
          .is('caption', null);

        if (error) throw error;

        toast({
          title: "✅ Database Cleaned",
          description: "Removed empty posts successfully.",
        });
        
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "❌ Action Failed",
        description: "Database action could not be completed.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthorized) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              Admin Mrwain Dashboard
            </h1>
            <p className="text-muted-foreground">
              Master control panel for DropShare by Mrwain Organization
            </p>
          </div>
          <Badge variant="default" className="bg-purple-500">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(systemStatus).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2 p-3 border rounded-lg">
                  {getStatusIcon(status)}
                  <div>
                    <p className="font-medium capitalize">{service}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Active (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Manage database operations and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDatabaseAction('cleanup')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Cleanup Empty Posts
                  </Button>
                  <Button variant="outline" onClick={fetchStats}>
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </Button>
                  <Button variant="outline" onClick={checkSystemStatus}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    System Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Monitor and manage user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="new-registrations" />
                    <Label htmlFor="new-registrations">Allow new registrations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="email-notifications" defaultChecked />
                    <Label htmlFor="email-notifications">System email notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Maintenance mode</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Database URL</Label>
                    <Input 
                      value={import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
                      disabled
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Input 
                      value={import.meta.env.MODE || 'production'}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Admin Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Admin Access
                      </p>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You have super admin privileges. Use these powers responsibly.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Admin Email</Label>
                      <Input 
                        value={user?.email || 'Not set'}
                        disabled
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Role</Label>
                      <Input 
                        value="Super Administrator"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminMrwain;