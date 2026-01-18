# Pi Payment System - Quick Reference Card

**Print this or bookmark for quick access**

---

## 🚀 Quick Commands

### Configuration
```bash
# Set in .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Set in Supabase: Settings → Edge Functions → Secrets
PI_API_KEY=your-pi-api-key
```

### Database
```sql
CREATE TABLE pi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  amount_pi DECIMAL(10, 6) NOT NULL,
  status TEXT NOT NULL,
  txid TEXT,
  memo TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pi_payments_payment_id ON pi_payments(payment_id);
CREATE INDEX idx_pi_payments_user_id ON pi_payments(user_id);
CREATE INDEX idx_pi_payments_status ON pi_payments(status);
```

### Deploy
```bash
supabase functions deploy pi-payment
```

---

## 💻 Code Snippets

### Simple Payment (RECOMMENDED)
```typescript
const { handlePaymentFlow } = usePiIntegration();

await handlePaymentFlow(
  { amount: 10, memo: 'Premium', metadata: { plan: 'pro' } },
  {
    onApprovalSuccess: () => console.log('✅ Approved'),
    onCompletionSuccess: () => grantAccess(),
    onError: (e) => showError(e)
  }
);
```

### Custom Payment
```typescript
const { createPayment } = usePiIntegration();

await createPayment(paymentData, {
  onReadyForServerApproval: async (id) => {
    // Your logic
  },
  onReadyForServerCompletion: async (id, txid) => {
    // Your logic
  }
});
```

### Check Status
```typescript
const { verifyPayment } = usePiIntegration();
const result = await verifyPayment(paymentId);
console.log(result.status); // 'completed' | 'approved' | 'pending'
```

### Get Incomplete Payments
```typescript
const { getIncompletePayments } = usePiIntegration();
const result = await getIncompletePayments();
result.payments?.forEach(p => console.log(p.payment_id));
```

---

## 📍 File Locations

| Purpose | File | Lines |
|---------|------|-------|
| Payment Utils | `src/lib/pi-payment-helper.ts` | 300+ |
| React Hook | `src/hooks/usePiIntegration.ts` | 380+ |
| Types | `src/types/pi-sdk.d.ts` | 40 |
| Demo | `src/components/PiIntegrationDemo.tsx` | 486+ |
| Backend | `supabase/functions/pi-payment/index.ts` | 325 |

---

## 🔍 Payment Methods

```typescript
// From usePiIntegration hook:

// Payment Operations
handlePaymentFlow(data, callbacks)      // Simple
createPayment(data, callbacks)          // Advanced
approvePayment(id, amount, memo)        // Direct
completePayment(id, txid)               // Direct
verifyPayment(id)                       // Status
cancelPayment(id)                       // Cancel
getIncompletePayments()                 // Recovery

// Auth
authenticate(scopes?)                   // Login

// Ads
showAd(type)                           // Show ad
isAdReady(type)                        // Check ready
requestAd(type)                        // Request ad
nativeFeaturesList()                   // Get features

// State
isInitialized: boolean
isAuthenticated: boolean
user: {uid, username} | null
error: string | null
```

---

## 🧪 Testing Flow

```
1. Open app in Pi Browser
2. Click Auth tab → Sign In
3. Click Payment tab
4. Click "💳 Start Payment (Managed)"
5. Watch console: [Payment Helper] logs
6. Approve in Pi Wallet
7. Check database: SELECT * FROM pi_payments ORDER BY created_at DESC;
8. See: status = 'completed' ✅
```

---

## ❌ Errors & Solutions

| Error | Solution |
|-------|----------|
| "Pi SDK not available" | Use Pi Browser (not regular) |
| "Payment approval failed" | Check VITE_SUPABASE_URL, PI_API_KEY |
| "Payment completion failed" | Verify txid from callback |
| "Table doesn't exist" | Create pi_payments table in Supabase |
| "Type errors" | Check src/types/pi-sdk.d.ts exists |

---

## 📊 Console Watch For

```javascript
// Successful payment shows:
✅ Pi SDK initialized successfully
[Payment Helper] ✅ Payment approved: {...}
[Payment Helper] ✅ Payment completed: {...}

// Then on screen:
✅ Payment successful! Premium access granted.

// In database:
SELECT * FROM pi_payments LIMIT 1;
// Shows: status = 'completed', txid = '...'
```

---

## 📚 Documentation Quick Links

| Document | Read Time | Purpose |
|----------|-----------|---------|
| `00_PI_PAYMENT_SUMMARY.md` | 5 min | Overview |
| `PI_PAYMENT_COMPLETE.md` | 5 min | Quick Start |
| `PI_PAYMENT_INDEX.md` | 3 min | Navigation |
| `PI_PAYMENT_FLOW_GUIDE.md` | 15 min | Architecture |
| `PI_PAYMENT_TESTING_GUIDE.md` | 20 min | Testing |
| `PI_PAYMENT_INTEGRATION_STATUS.md` | 25 min | Details |

---

## ✅ Pre-Deployment Checklist

- [ ] `.env.local` has VITE_SUPABASE_URL
- [ ] `.env.local` has VITE_SUPABASE_ANON_KEY
- [ ] Supabase has PI_API_KEY secret
- [ ] `pi_payments` table created
- [ ] Indexes created
- [ ] `pi-payment` function deployed
- [ ] TypeScript compiles: `npm run build`
- [ ] No console errors
- [ ] Demo works in Pi Browser

---

## 🎯 What Works Now

✅ Managed payment flow  
✅ Custom payment flow  
✅ Payment verification  
✅ Payment recovery  
✅ Full type safety  
✅ Error handling  
✅ Demo component  
✅ Complete docs  

---

## 🚀 Next Steps

1. Configure `.env.local`
2. Create database table
3. Deploy edge function
4. Test with demo
5. Implement access control
6. Monitor payments

---

## 💡 Key Insights

**Use `handlePaymentFlow()`** for 90% of cases  
**Use `createPayment()`** for complex logic  
**Use helper methods** for testing/debugging  

All three approaches work together - choose what fits your use case!

---

## 📞 If Stuck

1. Check browser console for [Payment Helper] logs
2. Review `PI_PAYMENT_TESTING_GUIDE.md`
3. Check Supabase function logs
4. Verify database has data
5. Read relevant doc (check index.md)

---

## ⚡ Success Indicators

✅ Console shows [Payment Helper] logs  
✅ User sees "✅ Payment successful"  
✅ Database records payment  
✅ status = 'completed'  
✅ txid populated  

When you see all of these = WORKING! 🎉

---

**All ready to use!** 🚀  
**Start with:** `00_PI_PAYMENT_SUMMARY.md`
