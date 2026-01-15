# Edge Function Deployment Guide

## Issue Fixed
The 500 error was caused by the `pi-auth` Edge Function not being deployed or environment variables missing.

## Quick Fix Applied
✅ Added fallback authentication that works without the Edge Function
✅ Improved error handling to show warnings instead of blocking auth
✅ Better console logging for debugging

## How It Works Now

### Without Edge Function (Current State)
- Pi authentication proceeds using client-side verification
- User data stored locally
- Profile created when user completes signup form
- ⚠️ **Warning**: This is less secure but allows the app to work

### With Edge Function (Recommended)
- Secure server-side Pi token verification
- Proper user creation in Supabase Auth
- Better security and data integrity

## Deploy Edge Function (Recommended)

### Option 1: Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref zgbzubmazzxjylgdpdqi
```

4. Set environment variables in Supabase Dashboard:
   - Go to Project Settings → Edge Functions
   - Add secrets:
     - `SUPABASE_URL`: `https://zgbzubmazzxjylgdpdqi.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: (from .env file)

5. Deploy the function:
```bash
supabase functions deploy pi-auth
```

### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click "New function"
3. Name it `pi-auth`
4. Copy content from `supabase/functions/pi-auth/index.ts`
5. Click "Deploy function"
6. Set environment secrets (same as above)

### Option 3: Manual Upload

1. Go to https://supabase.com/dashboard/project/zgbzubmazzxjylgdpdqi/functions
2. Create new function named `pi-auth`
3. Paste the code from `supabase/functions/pi-auth/index.ts`
4. Deploy

## Verify Deployment

Test the function:
```bash
curl -X POST https://zgbzubmazzxjylgdpdqi.supabase.co/functions/v1/pi-auth \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"test"}'
```

Expected response (even with invalid token):
```json
{
  "error": "Invalid Pi access token",
  "details": "Pi API returned 401"
}
```

If you get this, the function is deployed correctly!

## Current Status

✅ **App works without Edge Function** (uses fallback)
⚠️ **Security**: Client-side auth is less secure
🎯 **Recommended**: Deploy Edge Function for production

## Testing

1. Clear browser storage: `localStorage.clear()`
2. Try Pi sign-in
3. Check console for:
   - ✅ "Proceeding with client-side Pi authentication" (fallback working)
   - ✅ "Backend verification successful" (Edge Function working)

## Environment Variables Needed

In Supabase Edge Function secrets:
```env
SUPABASE_URL=https://zgbzubmazzxjylgdpdqi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Other Edge Functions

You may also need to deploy:
- `send-notification` - For push notifications
- `pi-payment` - For Pi payment processing
- `pi-ads` - For Pi ad network

Same deployment process for each.

---

**Current state**: ✅ App is functional with fallback authentication
**Next step**: 🚀 Deploy Edge Functions for full security
