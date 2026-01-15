// Push Notifications Service for DropShare
import { supabase } from '@/integrations/supabase/client';

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async init(): Promise<boolean> {
    try {
      // Check if push messaging is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications are not supported');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async subscribe(): Promise<boolean> {
    try {
      if (!this.registration) {
        await this.init();
      }

      if (!this.registration) {
        throw new Error('Service worker registration failed');
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      // Generate VAPID keys for your application
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLgUiMwcr7fLCX1PW1fzJ7pj8Q1mHgQWW8x9M5wB7iF5Y5xL5cL5yc';
      const uint8Array = this.urlB64ToUint8Array(vapidKey);
      const applicationServerKey = uint8Array.slice(0).buffer;

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Store subscription locally for now
      // TODO: Implement proper subscription storage when database types are updated
      console.log('Push subscription successful - stored locally');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        // TODO: Remove subscription from database when types are updated
        console.log('Push subscription removed locally');
        this.subscription = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async showNotification(data: PushNotificationData): Promise<void> {
    if (!this.registration || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-72x72.png',
      data: data.data,
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
    };

    await this.registration.showNotification(data.title, options);
  }

  // Real-time notification handlers
  async setupRealtimeNotifications(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Listen for new likes
    supabase
      .channel('likes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'likes',
          filter: `post_id=in.(SELECT id FROM posts WHERE user_id = '${user.id}')`
        },
        async (payload) => {
          const { data: likerProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', payload.new.user_id)
            .single();

          await this.showNotification({
            title: '❤️ New Like!',
            body: `${likerProfile?.display_name || likerProfile?.username || 'Someone'} liked your post`,
            tag: 'like',
            data: { type: 'like', post_id: payload.new.post_id },
          });
        }
      )
      .subscribe();

    // Listen for new comments
    supabase
      .channel('comments')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=in.(SELECT id FROM posts WHERE user_id = '${user.id}')`
        },
        async (payload) => {
          const { data: commenterProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', payload.new.user_id)
            .single();

          await this.showNotification({
            title: '💬 New Comment!',
            body: `${commenterProfile?.display_name || commenterProfile?.username || 'Someone'} commented on your post`,
            tag: 'comment',
            data: { type: 'comment', post_id: payload.new.post_id },
          });
        }
      )
      .subscribe();

    // Listen for new messages in conversations where user is a participant
    supabase
      .channel('messages')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Skip if this is the user's own message
          if (message.sender_id === user.id) return;
          
          // Check if user is a participant in this conversation
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', message.conversation_id)
            .eq('user_id', user.id)
            .single();
            
          if (!participant) return;
          
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', payload.new.sender_id)
            .single();

          await this.showNotification({
            title: '📨 New Message!',
            body: `${senderProfile?.display_name || senderProfile?.username || 'Someone'} sent you a message`,
            tag: 'message',
            requireInteraction: true,
            data: { type: 'message', conversation_id: payload.new.conversation_id },
          });
        }
      )
      .subscribe();

    // Listen for new followers
    supabase
      .channel('follows')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${user.id}`
        },
        async (payload) => {
          const { data: followerProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', payload.new.follower_id)
            .single();

          await this.showNotification({
            title: '👥 New Follower!',
            body: `${followerProfile?.display_name || followerProfile?.username || 'Someone'} started following you`,
            tag: 'follow',
            data: { type: 'follow', user_id: payload.new.follower_id },
          });
        }
      )
      .subscribe();
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isSubscribed(): boolean {
    return this.subscription !== null && Notification.permission === 'granted';
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export default PushNotificationService;