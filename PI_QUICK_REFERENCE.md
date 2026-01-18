# Pi Network Integration - Quick Reference

## 🚀 Quick Setup (5 minutes)

### 1. Install/Deploy Edge Functions
```bash
supabase functions deploy pi-auth
supabase functions deploy pi-payment
supabase functions deploy pi-ads
supabase functions deploy dropshare-api
```

### 2. Set Environment Variables
```bash
supabase secrets set PI_API_KEY=your-pi-api-key
supabase secrets set DROPSHARE_API_KEY=2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr
supabase secrets set DROPSHARE_VALIDATION_KEY=14171d43a16aebfb72ff8528ac2c1ff61c8405f2fa8649661dd735b25f819af24cc04d49ee88817bd4f18c511f35a2818b777779ce84d7704584ee36c519b56f
```

### 3. Use in Components
```tsx
import { usePiIntegration } from '@/hooks/usePiIntegration';
import { useDropShareApi } from '@/hooks/useDropShareApi';

export function MyComponent() {
  const { authenticate, createPayment, showAd } = usePiIntegration();
  const { verifyCredentials, logTransaction } = useDropShareApi();
  
  // Use in your component...
}
```

---

## 📋 Feature Checklist

### Pi Authentication ✅
- [x] Pi SDK loaded in HTML
- [x] `usePiIntegration()` hook created
- [x] Authentication method implemented
- [x] Token verification ready
- [ ] Backend `/me` endpoint verification (implement in your API)

### Pi Payments ✅
- [x] Edge function created: `pi-payment`
- [x] `createPayment()` method in hook
- [x] Server approval callback ready
- [x] Server completion callback ready
- [ ] Backend `/approve` endpoint (implement in your API)
- [ ] Backend `/complete` endpoint (implement in your API)

### Pi AdNetwork ✅
- [x] Edge function created: `pi-ads`
- [x] `showAd()` method in hook
- [x] Ad verification ready
- [x] Rewarded ads verification flow
- [ ] Backend ad reward logic (implement in your API)

### DropShare API ✅
- [x] Edge function created: `dropshare-api`
- [x] API key: `2yvymas2njxzgemeilxs9z5fjbivxkfw0wbwfnqcgwzipjqakuykqyjc9djfeawr`
- [x] Validation key: `14171d43a16aebfb72...` (provided)
- [x] `useDropShareApi()` hook created
- [x] Credential verification
- [x] Payload signing with HMAC-SHA256
- [x] Transaction logging
- [ ] Create `dropshare_transactions` table

---

## 🔗 Key Endpoints

### Pi API
```
https://api.minepi.com/v2/me                      # Verify access token
https://api.minepi.com/v2/payments/{id}/approve   # Approve payment
https://api.minepi.com/v2/payments/{id}/complete  # Complete payment
https://api.minepi.com/v2/ads/{id}               # Verify rewarded ad
```

### Your Supabase Edge Functions
```
/functions/v1/pi-auth           # Pi authentication
/functions/v1/pi-payment        # Pi payment approve/complete
/functions/v1/pi-ads            # Ad verification
/functions/v1/dropshare-api     # DropShare API management
```

---

## 💻 Code Examples

### Authenticate User
```tsx
const { authenticate, user } = usePiIntegration();

const handleLogin = async () => {
  const result = await authenticate(['payments']);
  if (result) {
    console.log('Logged in:', result.user.username);
  }
};
```

### Create Payment
```tsx
const { createPayment } = usePiIntegration();

const handlePayment = async () => {
  await createPayment(
    {
      amount: 3.14,
      memo: 'Purchase',
      metadata: { orderId: '123' }
    },
    {
      onReadyForServerApproval: async (paymentId) => {
        // Backend approves here
        await fetch('/api/approve-payment', {
          method: 'POST',
          body: JSON.stringify({ paymentId })
        });
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        // Backend completes here
        await fetch('/api/complete-payment', {
          method: 'POST',
          body: JSON.stringify({ paymentId, txid })
        });
      },
      onCancel: (paymentId) => console.log('Cancelled:', paymentId),
      onError: (error) => console.error('Error:', error)
    }
  );
};
```

### Show Rewarded Ad with Verification
```tsx
const { showAd, isAdReady, requestAd } = usePiIntegration();

const handleRewardedAd = async () => {
  // Check if ad is ready
  const { ready } = await isAdReady('rewarded');
  if (!ready) {
    await requestAd('rewarded');
  }

  // Show ad
  const response = await showAd('rewarded');
  
  if (response.result === 'AD_REWARDED') {
    // Verify on backend before rewarding
    const verified = await fetch('/api/verify-ad', {
      method: 'POST',
      body: JSON.stringify({ adId: response.adId })
    });
    
    if (verified.ok) {
      // Grant reward
      console.log('User earned reward!');
    }
  }
};
```

### Verify DropShare & Log Transaction
```tsx
const { verifyCredentials, signPayload, logTransaction } = useDropShareApi();

const handleTransaction = async () => {
  // Verify credentials
  const verified = await verifyCredentials({
    apiKey: 'YOUR_API_KEY',
    validationKey: 'YOUR_VALIDATION_KEY'
  });

  if (verified) {
    // Sign transaction data
    const txData = JSON.stringify({ userId: 'user1', amount: 100 });
    const { signature } = await signPayload(txData);

    // Log transaction
    await logTransaction({
      userId: 'user1',
      amount: 100,
      description: 'Purchase',
      signature
    });
  }
};
```

---

## 🔐 Security Checklist

### Authentication
- [ ] Verify `accessToken` on backend with `/me` endpoint
- [ ] Never store raw access tokens in database
- [ ] Store only `uid` from Pi user
- [ ] Implement token refresh mechanism

### Payments
- [ ] Backend must approve payment before user signs
- [ ] Backend must complete payment after user signs
- [ ] Verify payment status from Pi API
- [ ] Never trust frontend payment confirmation

### Ads
- [ ] Always verify rewarded ads on backend
- [ ] Check `mediator_ack_status === 'granted'`
- [ ] Never grant rewards without backend verification
- [ ] Handle ad loading failures gracefully

### DropShare API
- [ ] Use HTTPS for all requests
- [ ] Verify credentials on app startup
- [ ] Sign sensitive transactions
- [ ] Log all transactions for audit

---

## 📦 Database Setup

### Create transactions table
```sql
CREATE TABLE dropshare_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2),
  description TEXT,
  metadata JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Optional: Create payments table
```sql
CREATE TABLE pi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  amount_pi DECIMAL(10, 6),
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing

### Test Pi Auth
1. Open Pi Browser
2. Navigate to your app
3. Click "Sign In with Pi"
4. Confirm in Pi dialog
5. Check localStorage for `pi_auth_token`

### Test Pi Payment
1. Authenticate first
2. Click "Create Payment"
3. Confirm in Pi Wallet
4. Check backend logs for approval/completion

### Test Pi Ads
1. Call `showAd('interstitial')`
2. For rewarded ads, verify on backend first
3. Check that ad result matches expected values

### Test DropShare API
1. Call `verifyCredentials()`
2. Call `signPayload()`
3. Call `logTransaction()`
4. Verify data in Supabase

---

## 📖 Documentation Links

- **Pi Developer Guide:** https://pi-apps.github.io/community-developer-guide/
- **Pi GitHub Docs:** https://github.com/pi-apps/pi-platform-docs
- **Supabase Docs:** https://supabase.com/docs
- **Full Setup Guide:** See `PI_INTEGRATION_SETUP.md`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Pi SDK not available" | Ensure using Pi Browser, check index.html has SDK script |
| "Authentication fails" | Check mainnet config (sandbox: false), verify API key |
| "Ads not showing" | Check Pi Browser supports Ad Network, app is approved, user authenticated |
| "DropShare verification fails" | Verify API key/validation key correct, edge function deployed, env vars set |
| "Payment not completing" | Check backend approval/completion endpoints, verify txid is correct |

---

## ✨ Next Steps

1. **Implement Backend APIs**
   - `/api/approve-payment` - Call Pi API to approve
   - `/api/complete-payment` - Call Pi API to complete
   - `/api/verify-ad` - Call Pi API to verify reward

2. **Create Database Tables**
   - `dropshare_transactions` - Store all transactions
   - `pi_payments` - Store payment records (optional)
   - `pi_ads` - Store ad records (optional)

3. **Test Integration**
   - Use `PiIntegrationDemo.tsx` component
   - Test each feature in Pi Browser
   - Check browser console and backend logs

4. **Deploy to Production**
   - Update `PI_SANDBOX=false` (already set in index.html)
   - Deploy edge functions
   - Set production API keys
   - Test with real Pi transactions

---

## 💡 Pro Tips

- Always handle errors gracefully
- Log all transactions for debugging
- Use localStorage to persist auth state
- Check native features before using ads
- Verify all user actions on backend
- Implement proper error recovery flows
- Monitor edge function logs regularly
