# Send Notification Edge Function

This Supabase Edge Function processes the notification queue and sends web push notifications to subscribed users.

## Setup

1. **Set up VAPID keys** (required for web push):
   ```bash
   # Generate VAPID keys using web-push
   npx web-push generate-vapid-keys
   ```

2. **Set environment variables** in Supabase:
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY="your_public_key"
   supabase secrets set VAPID_PRIVATE_KEY="your_private_key"
   supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"
   ```

3. **Deploy the function**:
   ```bash
   supabase functions deploy send-notification
   ```

4. **Set up a cron job** to run this function periodically:
   - In Supabase Dashboard, go to Database > Cron Jobs
   - Create a new cron job:
     ```sql
     SELECT cron.schedule(
       'process-notifications',
       '* * * * *', -- Every minute
       $$
       SELECT net.http_post(
         url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification',
         headers := jsonb_build_object('Authorization', 'Bearer YOUR_ANON_KEY')
       );
       $$
     );
     ```

## How It Works

1. Database triggers (likes, comments, follows, messages) insert notifications into `notification_queue`
2. Cron job calls this edge function every minute
3. Function fetches unsent notifications
4. Sends web push notifications to all user subscriptions
5. Marks notifications as sent
6. Removes invalid/expired subscriptions

## Testing

Send a test notification:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```
