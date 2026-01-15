import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PushNotificationService from '@/lib/notifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  showTestNotification: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  const notificationService = PushNotificationService.getInstance();

  useEffect(() => {
    const initializeNotifications = async () => {
      const supported = await notificationService.init();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(notificationService.getPermissionStatus());
        setIsSubscribed(notificationService.isSubscribed());
        
        // Set up real-time notifications if user is logged in and subscribed
        if (user && notificationService.isSubscribed()) {
          await notificationService.setupRealtimeNotifications();
        }
      }
    };

    initializeNotifications();
  }, [user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const success = await notificationService.subscribe();
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        
        // Set up real-time notifications after successful subscription
        if (user) {
          await notificationService.setupRealtimeNotifications();
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return false;
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const success = await notificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const showTestNotification = useCallback(async (): Promise<void> => {
    await notificationService.showNotification({
      title: '🎉 Test Notification',
      body: 'Push notifications are working perfectly!',
      tag: 'test',
      data: { type: 'test' },
    });
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
    showTestNotification,
  };
};