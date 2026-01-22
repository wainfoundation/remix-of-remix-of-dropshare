import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Check, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'follow_request' | 'message';
  actor_id: string;
  post_id: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
  actor?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  post?: {
    image_url: string;
  };
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      markAsRead();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
      return;
    }

    // Fetch actor profiles
    const actorIds = [...new Set((data || []).map(n => n.actor_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', actorIds);

    const profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Fetch post thumbnails
    const postIds = (data || []).filter(n => n.post_id).map(n => n.post_id);
    const { data: posts } = await supabase
      .from('posts')
      .select('id, image_url')
      .in('id', postIds);

    const postsMap = (posts || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    setNotifications(
      (data || []).map(n => ({
        ...n,
        type: n.type as Notification['type'],
        actor: profilesMap[n.actor_id],
        post: n.post_id ? postsMap[n.post_id] : undefined,
      }))
    );
    setLoading(false);
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus className="h-4 w-4 text-primary" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const username = notification.actor?.username || 'Someone';
    switch (notification.type) {
      case 'like':
        return <><span className="font-semibold">{username}</span> liked your post</>;
      case 'comment':
        return <><span className="font-semibold">{username}</span> commented: {notification.message}</>;
      case 'follow':
        return <><span className="font-semibold">{username}</span> started following you</>;
      case 'follow_request':
        return <><span className="font-semibold">{username}</span> requested to follow you</>;
      case 'message':
        return <><span className="font-semibold">{username}</span> sent you a message</>;
      default:
        return notification.message;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.actor?.username) {
      navigate(`/profile/${notification.actor.username}`);
    }
  };

  const groupNotifications = (notifications: Notification[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 days': [],
      'Last 30 days': [],
      'Earlier': [],
    };

    notifications.forEach(n => {
      const date = new Date(n.created_at);
      if (date.toDateString() === today.toDateString()) {
        groups['Today'].push(n);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups['Yesterday'].push(n);
      } else if (date > lastWeek) {
        groups['Last 7 days'].push(n);
      } else if (date > new Date(today.setDate(today.getDate() - 30))) {
        groups['Last 30 days'].push(n);
      } else {
        groups['Earlier'].push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotifications(notifications);

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to see notifications</h2>
          <Button onClick={() => navigate('/login')} className="mt-6">Log In</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="glass backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 flex h-14 items-center px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold pr-8 text-white">Notifications</h1>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingLogo size="md" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No notifications yet</h2>
            <p className="mt-2 text-muted-foreground">
              When someone interacts with you, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(groupedNotifications).map(([group, items]) => 
              items.length > 0 && (
                <div key={group}>
                  <h2 className="px-4 py-3 text-sm font-semibold glass-subtle text-white/80">{group}</h2>
                  {items.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={notification.actor?.avatar_url || undefined} />
                          <AvatarFallback>
                            {notification.actor?.display_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">
                          {getNotificationText(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {notification.post?.image_url && (
                        <img
                          src={notification.post.image_url}
                          alt="Post"
                          className="h-11 w-11 rounded object-cover"
                        />
                      )}
                      {notification.type === 'follow' && (
                        <Button size="sm" variant="default">
                          Follow back
                        </Button>
                      )}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
