import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, Check, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings = () => {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
    showTestNotification,
  } = usePushNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        const success = await unsubscribe();
        if (success) {
          toast({
            title: "🔕 Notifications Disabled",
            description: "You won't receive push notifications anymore.",
          });
        }
      } else {
        if (permission === 'denied') {
          toast({
            title: "❌ Notifications Blocked",
            description: "Please enable notifications in your browser settings and refresh the page.",
            variant: "destructive",
          });
          return;
        }
        
        const success = await subscribe();
        if (success) {
          toast({
            title: "🔔 Notifications Enabled!",
            description: "You'll now receive real-time alerts for likes, comments, and messages.",
          });
          // Show test notification
          setTimeout(() => {
            showTestNotification();
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      await showTestNotification();
      toast({
        title: "📨 Test Sent!",
        description: "Check your notification to see how alerts will look.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  if (!isSupported) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BellOff className="h-4 w-4" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Allowed</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4" />
          Push Notifications
          {getPermissionBadge()}
        </CardTitle>
        <CardDescription className="text-xs">
          Get real-time alerts for likes, comments, and messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="text-xs font-medium">
              Enable Notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              {isSubscribed 
                ? "You'll receive real-time alerts" 
                : "Turn on to get instant notifications"
              }
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={permission === 'denied'}
          />
        </div>

        {isSubscribed && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestNotification}
            className="w-full text-xs"
          >
            <Smartphone className="h-3 w-3 mr-1" />
            Send Test Notification
          </Button>
        )}

        {permission === 'denied' && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-red-700">
              Notifications are blocked. Please enable them in your browser settings and refresh the page.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">You'll receive notifications for:</p>
          <ul className="space-y-1">
            <li>• ❤️ New likes on your posts</li>
            <li>• 💬 Comments on your content</li>
            <li>• 📨 Direct messages</li>
            <li>• 👥 New followers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;