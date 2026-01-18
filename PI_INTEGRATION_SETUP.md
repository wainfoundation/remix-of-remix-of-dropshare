# Pi Network & DropShare Integration Setup

## Overview
This document provides setup instructions for integrating:
- **Pi Network Authentication** (Pi Auth)
- **Pi Network Payments** (Pi Payment)
- **Pi Network Ads** (Pi AdNetwork)
- **DropShare API** with validation and signing

## Current Status

### ✅ Already Implemented
1. **Pi SDK Integration** - SDK loaded in `index.html` for production (mainnet)
2. **Pi Authentication** - Supabase edge function at `supabase/functions/pi-auth/index.ts`
3. **Pi Payments** - Supabase edge function at `supabase/functions/pi-payment/index.ts`
4. **Pi Ads Verification** - Supabase edge function at `supabase/functions/pi-ads/index.ts`
5. **DropShare API** - Supabase edge function at `supabase/functions/dropshare-api/index.ts` (NEW)

### 🎣 React Hooks (NEW)
- `usePiIntegration()` - Complete Pi Auth, Payment, and Ads management
- `useDropShareApi()` - DropShare API verification and transaction logging

## Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Pi Network API
VITE_PI_API_KEY=your-pi-api-key-here
VITE_PI_SANDBOX=false

# DropShare Configuration
VITE_DROPSHARE_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
VITE_DROPSHARE_VALIDATION_KEY=14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f

# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Supabase Edge Functions Configuration

Deploy edge functions with the required secrets:

```bash
# Set environment variables for edge functions
supabase secrets set PI_API_KEY=your-pi-api-key
supabase secrets set DROPSHARE_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
supabase secrets set DROPSHARE_VALIDATION_KEY=14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f
```

## Feature Documentation

### Pi Authentication

Use the `usePiIntegration` hook to authenticate users:

```tsx
import { usePiIntegration } from '@/hooks/usePiIntegration';

export function LoginComponent() {
  const { authenticate, user, isAuthenticated, error } = usePiIntegration();

  const handleLogin = async () => {
    const result = await authenticate(['payments']);
    if (result) {
      console.log('Logged in as:', result.user.username);
      // User is now authenticated
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Sign in with Pi</button>
      {error && <p>{error}</p>}
      {isAuthenticated && <p>Welcome, {user?.username}!</p>}
    </div>
  );
}
```

**Scopes:**
- `'username'` - Get user's username for personalization
- `'payments'` - Enable payment functionality

**Backend Verification:**
The `accessToken` from authentication must be verified on your backend using the `/me` endpoint:

```bash
curl -H "Authorization: Bearer {accessToken}" https://api.minepi.com/v2/me
```

### Pi Payments

Implement User-to-App payments:

```tsx
import { usePiIntegration } from '@/hooks/usePiIntegration';

export function PaymentComponent() {
  const { createPayment } = usePiIntegration();

  const handlePayment = async () => {
    const paymentData = {
      amount: 3.14,
      memo: 'Purchase in DropShare',
      metadata: { productId: '123', orderId: 'order-456' }
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId) => {
        // Send paymentId to backend for approval
        const response = await fetch('/api/payments/approve', {
          method: 'POST',
          body: JSON.stringify({ paymentId })
        });
        console.log('Payment approved');
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        // Send txid to backend for completion
        const response = await fetch('/api/payments/complete', {
          method: 'POST',
          body: JSON.stringify({ paymentId, txid })
        });
        console.log('Payment completed');
      },
      onCancel: (paymentId) => {
        console.log('Payment cancelled:', paymentId);
      },
      onError: (error, payment) => {
        console.error('Payment error:', error);
      }
    };

    try {
      await createPayment(paymentData, callbacks);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return <button onClick={handlePayment}>Pay with Pi</button>;
}
```

**Payment Flow:**
1. Frontend calls `Pi.createPayment()`
2. `onReadyForServerApproval` callback - Backend approves with `/approve` API
3. User signs transaction in Pi Wallet
4. `onReadyForServerCompletion` callback - Backend completes with `/complete` API
5. Payment flow closes

**Backend API Endpoints:**
- **Approve:** `POST /v2/payments/{paymentId}/approve`
- **Complete:** `POST /v2/payments/{paymentId}/complete`

### Pi AdNetwork

Display and verify ads:

```tsx
import { usePiIntegration } from '@/hooks/usePiIntegration';

export function AdComponent() {
  const { showAd, isAdReady, requestAd, nativeFeaturesList } = usePiIntegration();

  useEffect(() => {
    // Check if ads are supported
    nativeFeaturesList().then(features => {
      if (!features.includes('ad_network')) {
        console.warn('Ad network not supported on this Pi Browser version');
      }
    });
  }, []);

  // Show Interstitial Ad
  const showInterstitialAd = async () => {
    try {
      const response = await showAd('interstitial');
      if (response.result === 'AD_CLOSED') {
        console.log('Ad closed successfully');
      }
    } catch (error) {
      console.error('Failed to show ad:', error);
    }
  };

  // Show Rewarded Ad
  const showRewardedAd = async () => {
    try {
      const isReady = await isAdReady('rewarded');
      
      if (!isReady.ready) {
        await requestAd('rewarded');
      }

      const response = await showAd('rewarded');
      
      if (response.result === 'AD_REWARDED') {
        // Verify with backend before rewarding user
        const verified = await fetch('/api/ads/verify', {
          method: 'POST',
          body: JSON.stringify({ adId: response.adId })
        });
        
        if (verified.ok) {
          console.log('Reward user now');
          // Grant reward to user
        }
      }
    } catch (error) {
      console.error('Ad error:', error);
    }
  };

  return (
    <div>
      <button onClick={showInterstitialAd}>Show Ad</button>
      <button onClick={showRewardedAd}>Watch Ad for Reward</button>
    </div>
  );
}
```

**Ad Types:**
- **Interstitial Ads** - Full-screen ads between transitions
- **Rewarded Ads** - Full-screen ads with user rewards (must verify on backend)
- **Banner Ads** - Overlay ads (auto-managed by Pi Browser)

**Important Security Notes:**
- Always verify rewarded ads on backend before granting rewards
- Check `mediator_ack_status === 'granted'` before rewarding
- Use `/v2/ads/{adId}` API endpoint for verification

### DropShare API Integration

Manage DropShare credentials and transactions:

```tsx
import { useDropShareApi } from '@/hooks/useDropShareApi';

export function DropShareComponent() {
  const {
    isVerified,
    status,
    error,
    verifyCredentials,
    signPayload,
    logTransaction
  } = useDropShareApi();

  const handleVerify = async () => {
    const verified = await verifyCredentials({
      apiKey: '2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr',
      validationKey: '14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f'
    });
  };

  const handleTransaction = async () => {
    // Sign the transaction data
    const transactionData = {
      userId: 'user123',
      amount: 100,
      description: 'Product purchase'
    };

    const payload = JSON.stringify(transactionData);
    const { signature } = await signPayload(payload);

    // Log the transaction
    const result = await logTransaction({
      ...transactionData,
      metadata: { orderId: 'order-123' },
      signature
    });
  };

  return (
    <div>
      <button onClick={handleVerify}>Verify DropShare Credentials</button>
      {isVerified && <p>✅ DropShare API is verified</p>}
      {error && <p>❌ Error: {error}</p>}
      <button onClick={handleTransaction}>Log Transaction</button>
    </div>
  );
}
```

## DropShare API Endpoints

### 1. Verify Credentials
```
POST /dropshare-api/verify
{
  "apiKey": "...",
  "validationKey": "..."
}
```

### 2. Get API Status
```
GET /dropshare-api/status
```

### 3. Sign Payload
```
POST /dropshare-api/sign
{
  "payload": "..."
}
```

Returns:
```json
{
  "payload": "...",
  "signature": "hex-signature",
  "algorithm": "HMAC-SHA256"
}
```

### 4. Log Transaction
```
POST /dropshare-api/log-transaction
{
  "userId": "user-id",
  "amount": 100,
  "description": "Transaction description",
  "metadata": {},
  "signature": "optional-hex-signature"
}
```

## Testing

### Test Pi Auth
```bash
# Open Pi Browser and navigate to your app
# Click "Sign in with Pi" button
# Confirm authentication in Pi dialog
```

### Test Pi Payments
```bash
# Requires Pi Sandbox setup or mainnet
# Create payment with test amount
# Confirm in Pi Wallet
# Backend should approve and complete payment
```

### Test Pi Ads
```bash
# Requires Ad Network approval from Pi Core Team
# Call showAd() to display ads
# For rewarded ads, verify with backend before rewarding
```

### Test DropShare API
```bash
# Call verifyCredentials() to test API key
# Use signPayload() to generate signatures
# Use logTransaction() to record transactions
```

## Database Tables Required

Create these tables in Supabase for full functionality:

```sql
-- DropShare transactions table
CREATE TABLE dropshare_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2),
  description TEXT,
  metadata JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pi payments table (if not exists)
CREATE TABLE pi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  amount_pi DECIMAL(10, 6),
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pi ads table (if not exists)
CREATE TABLE pi_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  ad_type TEXT,
  rewarded BOOLEAN,
  verified BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Best Practices

### Authentication
- ✅ Always verify `accessToken` on backend with `/me` endpoint
- ✅ Store only `uid` (not token) in user database
- ✅ Implement token refresh mechanism
- ✅ Use HTTPS for all communications

### Payments
- ✅ Always call backend `/approve` endpoint before user signs
- ✅ Always call backend `/complete` endpoint after user signs
- ✅ Verify payment status before delivering goods/services
- ✅ Don't trust frontend payment confirmation

### Ads
- ✅ Always verify rewarded ads on backend before granting rewards
- ✅ Check `mediator_ack_status === 'granted'`
- ✅ Check if user's Pi Browser supports ad network
- ✅ Handle ad loading failures gracefully

### DropShare API
- ✅ Verify API credentials on app startup
- ✅ Sign sensitive transactions with validation key
- ✅ Log all transactions for audit trail
- ✅ Store signatures for verification

## Troubleshooting

### Pi SDK Not Available
- Ensure you're using Pi Browser
- Check that index.html includes Pi SDK script
- Verify `Pi.init()` is called correctly

### Authentication Fails
- Ensure you're on mainnet (not sandbox)
- Check that user has Pi App installed
- Verify API key is correct
- Try clearing localStorage

### Ads Not Showing
- Check if Pi Browser supports Ad Network
- Verify app is approved for monetization
- Ensure user is authenticated first
- Check browser console for errors

### DropShare API Errors
- Verify API key and validation key are correct
- Check Supabase edge function is deployed
- Ensure required environment variables are set
- Check browser console for CORS errors

## Support

For issues, refer to:
- Pi Documentation: https://pi-apps.github.io/community-developer-guide/
- Pi GitHub Docs: https://github.com/pi-apps/pi-platform-docs
- Supabase Docs: https://supabase.com/docs
