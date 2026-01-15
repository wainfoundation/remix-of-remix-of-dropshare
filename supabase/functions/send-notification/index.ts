// @ts-nocheck
// Supabase Edge Function: send-notification
// This function sends web push notifications to subscribed users
// Triggered by notification_queue table inserts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@dropshare.app';

interface NotificationPayload {
  title: string;
  body: string;
  data: Record<string, any>;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const subscriptionObject = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    // Using web-push library alternative for Deno
    // For production, you'd use a proper web-push library or service
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400', // 24 hours
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get unsent notifications from queue
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_queue')
      .select('*')
      .eq('sent', false)
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to send' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const notification of notifications) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabaseClient
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', notification.user_id);

      if (subError || !subscriptions || subscriptions.length === 0) {
        // Mark as sent even if no subscriptions (avoid retry loop)
        await supabaseClient
          .from('notification_queue')
          .update({ sent: true })
          .eq('id', notification.id);
        continue;
      }

      // Send to all user's subscriptions
      const payload: NotificationPayload = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      };

      let sentToAny = false;

      for (const subscription of subscriptions) {
        const success = await sendWebPushNotification(
          {
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
          payload
        );

        if (success) {
          sentToAny = true;
        } else {
          // Remove invalid subscriptions
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }
      }

      // Mark notification as sent
      await supabaseClient
        .from('notification_queue')
        .update({ sent: true })
        .eq('id', notification.id);

      results.push({
        notification_id: notification.id,
        sent: sentToAny,
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        count: results.length,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
