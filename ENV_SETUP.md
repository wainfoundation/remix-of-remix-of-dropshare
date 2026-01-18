# Environment Configuration Guide

## File Locations

Place these credentials in the appropriate configuration files:

### `.env.local` (Frontend Environment Variables)

```env
# ==============================
# Pi Network Configuration
# ==============================

# Pi SDK will run in MAINNET (production) mode
# This is already configured in index.html: sandbox: false

# Pi API Key (from Pi Developer Portal)
VITE_PI_API_KEY=your-pi-api-key-here

# ==============================
# DropShare API Configuration
# ==============================

# DropShare API Key (provided)
VITE_DROPSHARE_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr

# DropShare Validation Key (provided)
VITE_DROPSHARE_VALIDATION_KEY=14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f

# ==============================
# Supabase Configuration
# ==============================

# From your Supabase project settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# ==============================
# Feature Flags
# ==============================

# Enable/disable features
VITE_ENABLE_PI_AUTH=true
VITE_ENABLE_PI_PAYMENTS=true
VITE_ENABLE_PI_ADS=true
VITE_ENABLE_DROPSHARE_API=true
```

### Supabase Secrets (Edge Functions)

Deploy these secrets to Supabase for edge function usage:

```bash
# Run these commands:
supabase secrets set PI_API_KEY=your-pi-api-key
supabase secrets set DROPSHARE_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
supabase secrets set DROPSHARE_VALIDATION_KEY=14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f
```

To verify secrets are set:
```bash
supabase secrets list
```

---

## Credential Reference

### DropShare API Credentials (PROVIDED)

| Credential | Value |
|------------|-------|
| **API Key** | `2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr` |
| **Validation Key** | `14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f` |
| **Algorithm** | HMAC-SHA256 |

### Where to Get Pi API Key

1. Go to https://develop.pi in Pi Browser
2. Create or select your application
3. Go to **Keys & Credentials** section
4. Copy your **API Key**

### Where to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Settings → API
4. Copy:
   - **Project URL**
   - **Anon Public Key**
   - **Service Role Key** (for edge functions)

---

## Setup Steps

### 1. Create `.env.local`

```bash
# Create the file
touch .env.local

# Add the environment variables from above
# Use your actual Supabase and Pi credentials
```

### 2. Deploy Supabase Edge Functions

```bash
# Make sure you have the Supabase CLI installed
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy pi-auth
supabase functions deploy pi-payment
supabase functions deploy pi-ads
supabase functions deploy dropshare-api

# Verify deployment
supabase functions list
```

### 3. Set Edge Function Secrets

```bash
# Set all required secrets
supabase secrets set PI_API_KEY=your-actual-pi-api-key
supabase secrets set DROPSHARE_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
supabase secrets set DROPSHARE_VALIDATION_KEY=14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f

# Verify they are set
supabase secrets list
```

### 4. Create Required Database Tables

Run in Supabase SQL Editor:

```sql
-- DropShare Transactions
CREATE TABLE dropshare_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2),
  description TEXT,
  metadata JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pi Payments (Optional)
CREATE TABLE pi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  amount_pi DECIMAL(10, 6),
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pi Ads (Optional)
CREATE TABLE pi_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ad_type TEXT,
  rewarded BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  mediator_ack_status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE dropshare_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_ads ENABLE ROW LEVEL SECURITY;
```

### 5. Test Configuration

```bash
# Start development server
npm run dev

# Open browser console (F12)
# You should see: "✅ Pi SDK initialized for MAINNET (Production)"

# Try calling the verification endpoints
curl -X GET http://localhost:5173/functions/v1/dropshare-api/info
```

---

## Accessing from Your Code

### In React Components

```tsx
// Access frontend env variables
const apiKey = import.meta.env.VITE_DROPSHARE_API_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// All variables starting with VITE_ are exposed to frontend
```

### In Edge Functions

```typescript
// Access secrets in edge functions
const PI_API_KEY = Deno.env.get("PI_API_KEY");
const DROPSHARE_API_KEY = Deno.env.get("DROPSHARE_API_KEY");

// Note: No VITE_ prefix needed in edge functions
```

---

## Verification Checklist

- [ ] `.env.local` file created with all VITE_ variables
- [ ] Pi API Key obtained from Pi Developer Portal
- [ ] Supabase URL and keys from Supabase project settings
- [ ] DropShare API Key and Validation Key copied (provided)
- [ ] Edge functions deployed to Supabase
- [ ] Secrets set in Supabase
- [ ] Database tables created
- [ ] App loads without console errors
- [ ] Pi SDK initializes on app start
- [ ] DropShare API endpoint responds to requests

---

## Troubleshooting

### "Pi SDK not available"
- Check index.html has the Pi SDK script tag
- Ensure you're using Pi Browser
- Check browser console for script loading errors

### "Environment variable undefined"
- Restart dev server after adding `.env.local`
- Ensure variable name starts with `VITE_`
- Use `import.meta.env.VITE_VARIABLE_NAME` to access

### "Edge function returns 401"
- Verify secrets are set: `supabase secrets list`
- Check secret names match exactly (case-sensitive)
- Redeploy function after setting secrets

### "Supabase edge function not found"
- Verify function deployed: `supabase functions list`
- Check function is in `supabase/functions/` directory
- Redeploy: `supabase functions deploy function-name`

### "CORS error from edge function"
- Check corsHeaders in edge function
- Verify Supabase project URL matches env variable
- Try accessing from Supabase dashboard directly

---

## Security Notes

🔒 **Never commit `.env.local` to git**
- Add to `.gitignore` (usually already there)
- Keep credentials private
- Use different keys for dev/production

🔒 **Store secrets in Supabase for edge functions**
- Don't hardcode secrets in function code
- Use `Deno.env.get()` to access
- Secrets not visible in function logs

🔒 **Verify tokens on backend**
- Don't trust frontend Pi verification
- Always verify with Pi API on backend
- Check that txid matches before completing payment

---

## API Endpoints After Setup

Once everything is deployed, these endpoints will work:

```bash
# Verify DropShare credentials
curl -X POST http://localhost:5173/functions/v1/dropshare-api/verify \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"...","validationKey":"..."}'

# Get API status
curl -X GET http://localhost:5173/functions/v1/dropshare-api/status

# Sign payload
curl -X POST http://localhost:5173/functions/v1/dropshare-api/sign \
  -H "Content-Type: application/json" \
  -d '{"payload":"..."}'

# Log transaction
curl -X POST http://localhost:5173/functions/v1/dropshare-api/log-transaction \
  -H "Content-Type: application/json" \
  -d '{"userId":"...","amount":100,"description":"..."}'
```

---

## Next Steps

1. ✅ Create `.env.local` with your credentials
2. ✅ Deploy edge functions to Supabase
3. ✅ Set secrets in Supabase
4. ✅ Create database tables
5. ✅ Test with `PiIntegrationDemo.tsx` component
6. ✅ Implement backend APIs for payments/ads
7. ✅ Deploy to production

See `PI_INTEGRATION_SETUP.md` for detailed feature documentation.
