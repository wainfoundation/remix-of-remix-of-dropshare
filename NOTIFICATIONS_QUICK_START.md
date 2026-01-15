# Real Push Notifications - Quick Reference

## 🚀 Quick Setup (5 minutes)

### 1. Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

### 2. Add to .env
```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

### 3. Set Supabase Secrets
```bash
supabase secrets set VAPID_PUBLIC_KEY="your_public_key"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key"
supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"
```

### 4. Deploy Everything
```bash
# PowerShell
.\deploy-notifications.ps1

# Or manually:
supabase db push
supabase functions deploy send-notification
```

### 5. Setup Cron Job
In Supabase SQL Editor:
```sql
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_REF.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_ANON_KEY')
  );
  $$
);
```

---

## ✨ What You Get

- **❤️ Like Notifications**: Instant alerts when someone likes your post
- **💬 Comment Notifications**: Get notified of new comments
- **👥 Follow Notifications**: Know when someone follows you
- **📨 Message Notifications**: Real-time DM alerts (with requireInteraction)
- **🔄 Share Notifications**: See when your content is shared

---

## 🎯 How It Works

```
User likes post → Trigger fires → Queue notification
                                         ↓
                                  Cron job (every 1min)
                                         ↓
                                  Edge function processes
                                         ↓
                                  Web Push sent
                                         ↓
                                  Service Worker displays
                                         ↓
                                  User sees notification! 🎉
```

---

## 🧪 Testing

1. **Login** to DropShare
2. **Allow** notifications when prompted
3. **From another account**, like/comment on your post
4. **See notification** appear instantly!

Or use the test button in Notification Settings.

---

## 📁 Files Changed

- ✅ `supabase/migrations/20260115_push_notifications.sql` - Database schema + triggers
- ✅ `supabase/functions/send-notification/` - Edge function to send push
- ✅ `public/sw.js` - Service worker enhanced for notifications
- ✅ `src/lib/notifications.ts` - Notification service updated
- ✅ `src/contexts/AuthContext.tsx` - Auto-request permissions on login
- ✅ `src/hooks/use-push-notifications.ts` - React hook (already existed)
- ✅ `src/components/NotificationSettings.tsx` - Settings UI (already existed)

---

## 🔧 Troubleshooting

**No notifications appearing?**
- Check browser permissions (must be "Allow")
- Verify cron job is running (Supabase Dashboard → Database → Cron Jobs)
- Check Edge Function logs (Dashboard → Edge Functions)
- Ensure VAPID keys are set correctly

**Permission denied?**
- User must manually enable in browser settings if previously denied
- Try in incognito/private window

**Notifications not sending?**
```sql
-- Check notification queue
SELECT * FROM notification_queue WHERE sent = false;

-- Check subscriptions
SELECT * FROM push_subscriptions;
```

---

## 📖 Full Documentation

See `PUSH_NOTIFICATIONS_SETUP.md` for complete setup guide.

---

## 🎉 Done!

Your app now has **real push notifications** just like Facebook and Instagram!

Users will receive instant alerts for:
- Every like on their posts ❤️
- Every comment 💬
- Every new follower 👥
- Every message 📨
- Every share 🔄

**Enjoy your real-time notification system!** 🚀
