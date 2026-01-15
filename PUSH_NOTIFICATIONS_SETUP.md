# Push Notifications Setup Guide

## 🔔 Real-time Push Notifications for DropShare

This guide will help you set up **real push notifications** like Facebook and Instagram, where users get instant alerts for:
- ❤️ **Likes** on their posts
- 💬 **Comments** on their posts
- 👥 **New followers**
- 📨 **Direct messages**
- 🔄 **Shares** of their content

---

## Prerequisites

1. **Node.js** installed (for generating VAPID keys)
2. **Supabase project** set up
3. **Supabase CLI** installed

---

## Step 1: Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLgUiMwcr7f...
Private Key: xYzABc123DEfgHIjklMNopQRstUVwxYZ...
```

**Save these keys!** You'll need them in the next steps.

---

## Step 2: Set Environment Variables

### For Supabase Edge Functions:

```bash
supabase secrets set VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY_HERE"
supabase secrets set VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"
```

### For Frontend (.env):

Create or update your `.env` file:

```env
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

---

## Step 3: Deploy Database Migration

Run the push notifications migration:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL file in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/20260115_push_notifications.sql
```

This creates:
- ✅ `push_subscriptions` table (stores user device subscriptions)
- ✅ `notification_queue` table (queues notifications to send)
- ✅ Database triggers for likes, comments, follows, messages, shares
- ✅ Helper functions for notification management

---

## Step 4: Deploy Edge Function

Deploy the notification sender:

```bash
supabase functions deploy send-notification
```

---

## Step 5: Set Up Cron Job

To process notifications automatically, set up a cron job in Supabase:

1. Go to **Supabase Dashboard** → **Database** → **Extensions**
2. Enable the **pg_cron** extension
3. Go to **SQL Editor** and run:

```sql
-- Schedule notification processing every minute
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Authorization', 
      'Bearer YOUR_SUPABASE_ANON_KEY'
    )
  );
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SUPABASE_ANON_KEY` with your anon/public key

---

## Step 6: Update Service Worker

The service worker is already set up at `public/sw.js`. Make sure it's registered by checking `src/lib/notifications.ts`.

---

## Step 7: Add Notification Icons

Add these icon files to your `public/` folder:
- `icon-72x72.png` (badge icon)
- `icon-192x192.png` (notification icon)
- `icon-512x512.png` (app icon)

---

## Testing Notifications

### 1. Enable Notifications in Browser

After logging in, users should see a browser permission prompt. Click **Allow**.

### 2. Test from Another Account

1. Create/login to two accounts
2. From Account A, like/comment on Account B's post
3. Account B should receive a notification instantly!

### 3. Manual Test

You can trigger a test notification via the notification settings page or by running:

```typescript
const notificationService = PushNotificationService.getInstance();
await notificationService.showTestNotification();
```

---

## Troubleshooting

### Notifications not appearing?

1. **Check browser permissions**: 
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Ensure DropShare is allowed

2. **Check console logs**:
   - Look for errors in browser console (F12)
   - Check Edge Function logs in Supabase Dashboard

3. **Verify service worker**:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
   ```

4. **Check subscription**:
   ```sql
   SELECT * FROM push_subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```

5. **Check notification queue**:
   ```sql
   SELECT * FROM notification_queue WHERE sent = false;
   ```

### Permission denied?

Users must manually re-enable notifications in browser settings if they previously denied.

### VAPID errors?

Ensure:
- Keys are valid base64 strings
- Public key is set in `.env` as `VITE_VAPID_PUBLIC_KEY`
- Private key is set in Supabase secrets

---

## How It Works

### Architecture

```
User Action (Like/Comment/Follow)
        ↓
Database Trigger Fires
        ↓
Insert to notification_queue
        ↓
Cron Job (every minute)
        ↓
Edge Function: send-notification
        ↓
Fetch push_subscriptions for user
        ↓
Send Web Push to all devices
        ↓
Service Worker receives push
        ↓
Display notification to user
```

### Database Triggers

Each user action triggers a notification:

- **Like**: `trigger_notify_on_like`
- **Comment**: `trigger_notify_on_comment`
- **Follow**: `trigger_notify_on_follow`
- **Message**: `trigger_notify_on_message`
- **Share**: `trigger_notify_on_share`

### Service Worker

The service worker (`public/sw.js`) runs in the background and:
- Listens for push events
- Displays notifications
- Handles notification clicks (opens relevant page)
- Manages notification actions (View/Dismiss)

---

## Security Notes

⚠️ **Important:**
- Keep VAPID private key secret (never expose in frontend)
- Use HTTPS in production (required for service workers)
- Validate notification data in edge function
- Rate-limit notification sending to prevent abuse

---

## Production Checklist

- [ ] VAPID keys generated and set
- [ ] Environment variables configured
- [ ] Database migration deployed
- [ ] Edge function deployed
- [ ] Cron job scheduled
- [ ] Service worker registered
- [ ] Notification icons added
- [ ] HTTPS enabled
- [ ] Tested on multiple devices
- [ ] Browser compatibility verified

---

## Monitoring

Check notification health:

```sql
-- Recent notifications
SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 50;

-- Unsent notifications
SELECT COUNT(*) FROM notification_queue WHERE sent = false;

-- Active subscriptions
SELECT COUNT(*) FROM push_subscriptions;

-- Subscriptions per user
SELECT user_id, COUNT(*) as device_count 
FROM push_subscriptions 
GROUP BY user_id 
ORDER BY device_count DESC;
```

---

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Verify browser console for errors
3. Test with `showTestNotification()`
4. Review database trigger logs

---

**🎉 Congratulations!** Your users now get real-time push notifications just like Facebook and Instagram!
