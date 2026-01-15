import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone, Heart, MessageCircle, UserPlus, Send } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';
import NotificationSettings from '@/components/NotificationSettings';

const NotificationDemo = () => {
  const [testsSent, setTestsSent] = useState(0);
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    showTestNotification,
  } = usePushNotifications();

  const notificationTests = [
    {
      icon: Heart,
      title: '❤️ Like Notification',
      description: 'Test how like notifications appear',
      action: async () => {
        await showTestNotification();
        toast({
          title: 'Test notification sent!',
          description: 'Check your browser notifications',
        });
      },
    },
    {
      icon: MessageCircle,
      title: '💬 Comment Notification',
      description: 'Test comment notification format',
      action: async () => {
        await showTestNotification();
        toast({
          title: 'Test notification sent!',
          description: 'Check your browser notifications',
        });
      },
    },
    {
      icon: Send,
      title: '📨 Message Notification',
      description: 'Test direct message alerts',
      action: async () => {
        await showTestNotification();
        toast({
          title: 'Test notification sent!',
          description: 'Check your browser notifications',
        });
      },
    },
    {
      icon: UserPlus,
      title: '👥 Follower Notification',
      description: 'Test new follower alerts',
      action: async () => {
        await showTestNotification();
        toast({
          title: 'Test notification sent!',
          description: 'Check your browser notifications',
        });
      },
    },
  ];

  const handleTestNotification = async (test: typeof notificationTests[0]) => {
    try {
      await test.action();
      setTestsSent(prev => prev + 1);
      toast({
        title: "📨 Test Sent!",
        description: `Check your notifications to see the ${test.title.split(' ')[1]} alert`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>;
    }
    if (permission === 'denied') {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (isSubscribed) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">🔔 Push Notifications</h1>
          <p className="text-muted-foreground">
            Test and configure real-time push notifications for DropShare
          </p>
          <div className="flex items-center gap-2">
            Status: {getStatusBadge()}
            {testsSent > 0 && (
              <Badge variant="outline">
                {testsSent} test{testsSent === 1 ? '' : 's'} sent
              </Badge>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Notification Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Try different types of notifications to see how they'll appear
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSubscribed ? (
              <div className="text-center p-6 border border-dashed rounded-lg">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">Enable Notifications First</h3>
                <p className="text-sm text-muted-foreground">
                  Turn on push notifications above to test different alert types
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {notificationTests.map((test, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <test.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{test.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {test.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification(test)}
                    >
                      Send Test
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Real-time Notifications:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Get instant alerts when someone likes your posts</li>
                <li>• Receive notifications for new comments on your content</li>
                <li>• Stay updated on direct messages</li>
                <li>• Know immediately when you gain new followers</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Browser Support:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Works on Chrome, Firefox, Safari, and Edge</li>
                <li>• Available on both desktop and mobile browsers</li>
                <li>• Notifications work even when DropShare tab is closed</li>
                <li>• Respects your browser's notification settings</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Privacy:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Notifications are sent only to your devices</li>
                <li>• You can disable them at any time</li>
                <li>• No personal data is shared with external services</li>
                <li>• Subscription data is securely stored in our database</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default NotificationDemo;