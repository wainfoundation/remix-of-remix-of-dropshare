# Pi Payment - Testing & Verification Guide

## Quick Start - Test Payment Flow

### 1. Verify Setup is Complete

```bash
# Check required files exist
- src/lib/pi-payment-helper.ts ✅
- src/hooks/usePiIntegration.ts ✅ (updated)
- supabase/functions/pi-payment/index.ts ✅
- src/types/pi-sdk.d.ts ✅
```

### 2. Verify Environment Variables

Check `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co ✅
VITE_SUPABASE_ANON_KEY=your-key-here ✅
```

### 3. Verify Supabase Configuration

In Supabase Dashboard → Settings → Edge Functions → Secrets:
```
PI_API_KEY=your-api-key-from-pi-developers ✅
```

### 4. Verify Database Table

In Supabase Dashboard → SQL Editor:

```sql
-- Run this to verify table exists
SELECT * FROM pi_payments LIMIT 1;

-- If table doesn't exist, create it:
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

---

## Testing Steps

### Step 1: Open App in Pi Browser

1. Open **Pi Browser** (testnet or mainnet mode)
2. Navigate to your app URL
3. You should see the integration demo component

### Step 2: Authenticate User

1. Click **Auth** tab
2. Click **Sign In with Pi**
3. Approve in Pi Wallet popup
4. ✅ Confirm: "User authenticated" message appears
5. User info displays (UID, username)

**Console Check:**
```
✅ Pi authentication successful
User ID: <uid>
Username: <username>
```

### Step 3: Test Payment Flow (Managed Approach)

1. Click **Payment** tab
2. Verify: "Authenticated" status shown
3. Click **💳 Start Payment (Managed)**

**Watch Browser Console for:**
```
[Payment Helper] Creating payment: {amount: 1.5, ...}
[Payment Helper] Approving payment: {paymentId, userId, amount}
[Payment Helper] ✅ Payment approved: {...}
[Payment Helper] Completing payment: {paymentId, txid}
[Payment Helper] ✅ Payment completed: {...}
```

**Step Flow:**
- Pi payment UI opens
- User selects payment method
- Payment UI shows amount (1.5 Pi)
- User confirms (Pi Wallet popup)
- "Payment approved! Waiting for completion..." message
- Transaction signs in wallet
- "✅ Payment successful! Premium access granted." message

### Step 4: Test Payment Flow (Custom Approach)

1. Click **💳 Start Payment (Custom)**

**Watch Console for:**
```
Creating payment: {amount: 1.5, memo, metadata}
✅ Payment created: {...}
Payment ready for approval: <payment-id>
✅ Payment approved: {...}
Payment ready for completion: {paymentId, txid}
✅ Payment completed: {...}
Payment verification: {status: 'completed', verified: true}
```

### Step 5: Verify Database Storage

In Supabase Dashboard → SQL Editor:

```sql
SELECT * FROM pi_payments 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected Results:**
- ✅ 1-2 rows created (one for each payment attempt)
- ✅ payment_id column filled
- ✅ user_id matches authenticated user
- ✅ amount_pi = 1.5
- ✅ status = 'completed' OR 'approved'
- ✅ txid column filled (for completed)
- ✅ metadata contains productId, orderId, timestamp

### Step 6: Verify Edge Function Logs

In Supabase Dashboard → Edge Functions → pi-payment:

```
Function logs should show:
✅ POST request received
✅ Action: approve | complete | verify | cancel | incomplete
✅ PaymentId validation
✅ Pi API call successful
✅ Database record created/updated
✅ Response sent to frontend
```

---

## Test Scenarios

### Scenario 1: Successful Payment

```
Expected behavior:
1. Click "Start Payment (Managed)"
2. Payment UI opens and shows 1.5 Pi
3. User approves in Pi Wallet
4. Backend approve() executes
5. User signs transaction in wallet
6. Backend complete() executes with txid
7. Success message displays
8. Database shows 1 completed payment record

Check console for:
[Payment Helper] ✅ Payment approved: ...
[Payment Helper] ✅ Payment completed: ...
```

### Scenario 2: User Cancels Payment

```
Expected behavior:
1. Click "Start Payment"
2. Payment UI opens
3. User clicks Cancel button
4. onCancel callback fires
5. Message: "Payment cancelled by user"

Check console for:
onCancel: (paymentId) called
cancelPaymentWithBackend() executes
```

### Scenario 3: Payment Verification

```
Expected behavior:
1. After successful payment
2. Call verifyPayment(paymentId)
3. Check status = 'completed'
4. Confirm verified = true

Code example:
const result = await pi.verifyPayment('payment-id');
console.log(result.status); // 'completed'
console.log(result.verified); // true
```

### Scenario 4: Recover Incomplete Payments

```
Expected behavior:
1. Simulate payment that fails after approval
2. Call getIncompletePayments()
3. Check list contains incomplete payment
4. Retry completion with txid

Code example:
const result = await pi.getIncompletePayments();
result.payments?.forEach(p => {
  console.log(`Incomplete: ${p.payment_id}`);
});
```

---

## Debugging Checklist

### Payment Not Creating

- [ ] Pi SDK initialized? (check console: "Pi SDK Initialized")
- [ ] User authenticated? (check localStorage: pi_user_id)
- [ ] Pi.createPayment exists? (check window.Pi in console)
- [ ] No browser errors? (F12 → Console)

```javascript
// Debug in console
console.log(window.Pi); // Should show Pi SDK object
console.log(localStorage.getItem('pi_auth_token')); // Should exist
```

### Approval Not Working

- [ ] VITE_SUPABASE_URL correct? (check .env.local)
- [ ] SUPABASE_ANON_KEY correct? (check .env.local)
- [ ] Edge function deployed? (check Supabase dashboard)
- [ ] PI_API_KEY secret set? (check Supabase secrets)

```javascript
// Debug in console
const url = import.meta.env.VITE_SUPABASE_URL;
console.log('Supabase URL:', url); // Should show URL
```

### Completion Not Working

- [ ] txid provided to completePayment? (check callback param)
- [ ] txid from correct callback? (should be onReadyForServerCompletion)
- [ ] Edge function handling txid? (check function code)

```javascript
// Check callback is receiving txid
onReadyForServerCompletion: (paymentId, txid) => {
  console.log('txid:', txid); // Should show transaction ID
}
```

### Database Not Recording

- [ ] Table exists? (run: SELECT * FROM pi_payments)
- [ ] RLS policies correct? (check Supabase Auth policies)
- [ ] Edge function error? (check function logs)

```sql
-- Check if table created
SELECT count(*) FROM pi_payments;
-- Should show: count
--             -----
--                0 (or more)
```

---

## Manual Payment Testing Without Pi Browser

### Using Mock Pi Object

Create a test file to simulate Pi SDK:

```typescript
// src/test/mock-pi.ts
export function setupMockPi() {
  // @ts-ignore
  window.Pi = {
    createPayment: async (paymentData, callbacks) => {
      console.log('Mock: Payment created, paymentId: mock-payment-123');
      
      setTimeout(() => {
        callbacks.onReadyForServerApproval('mock-payment-123');
      }, 1000);
      
      setTimeout(() => {
        callbacks.onReadyForServerCompletion('mock-payment-123', 'mock-txid-456');
      }, 3000);
      
      return { paymentId: 'mock-payment-123' };
    }
  };
}

// In your test component
import { setupMockPi } from '@/test/mock-pi';

export function TestComponent() {
  useEffect(() => {
    // Uncomment for testing without Pi Browser:
    // setupMockPi();
  }, []);
  
  // ... rest of component
}
```

---

## Common Issues & Solutions

### Issue: "Pi SDK not available"

**Cause:** Pi SDK not loaded before React app initializes

**Solution:**
1. Verify Pi SDK script in `index.html`
2. Ensure script loads before React bootstrap
3. Check that Pi Browser is used (not regular browser)

```html
<!-- In index.html, BEFORE React app loads -->
<script src="https://sdk.minepi.com/pi-sdk.js"></script>
```

### Issue: "Payment approval failed"

**Cause:** Edge function error or wrong paymentId

**Solution:**
1. Check Supabase edge function logs
2. Verify paymentId format
3. Confirm PI_API_KEY set in secrets
4. Check network tab for HTTP errors

```
F12 → Network → /pi-payment request
Check Response status: 200 ✅
```

### Issue: "onReadyForServerCompletion not called"

**Cause:** Approval failed or user cancelled

**Solution:**
1. Verify approval completed (check console logs)
2. Check Pi Wallet balance >= amount
3. Retry payment

### Issue: "Database table doesn't exist"

**Cause:** Table not created

**Solution:**
1. Go to Supabase → SQL Editor
2. Create table using schema provided above
3. Verify table creation: SELECT * FROM pi_payments

### Issue: Type error "Pi not defined"

**Cause:** TypeScript configuration issue

**Solution:**
1. Verify `src/types/pi-sdk.d.ts` exists
2. Check `tsconfig.app.json` includes `src/types`
3. Restart TypeScript: Command+Shift+P → Restart TS Server

---

## Performance Checklist

- [ ] Payment creation < 2 seconds
- [ ] Approval callback fires immediately
- [ ] Completion callback fires after user signs
- [ ] No memory leaks (close devtools Memory tab)
- [ ] No console errors or warnings
- [ ] Database query < 500ms

---

## Security Checklist

- [ ] Never expose PI_API_KEY in frontend code
- [ ] All Pi API calls go through edge function
- [ ] User ID verified before approving payment
- [ ] txid verified from Pi API before completing
- [ ] Payment metadata sanitized before storage
- [ ] No sensitive data in error messages

---

## Success Indicators

✅ Payment flow complete when you see:

1. **Console logs:** [Payment Helper] ✅ Payment completed
2. **User message:** "✅ Payment successful! Premium access granted."
3. **Database:** New record in pi_payments with status = 'completed'
4. **Edge function:** Successful requests in logs
5. **User experience:** Smooth flow without errors

---

## Next Steps After Testing

1. **Implement access control:**
   ```typescript
   // After successful payment
   if (result.verified && result.status === 'completed') {
     updateUserSubscription(userId, 'premium');
     unlockPremiumFeatures();
   }
   ```

2. **Add payment history:**
   ```typescript
   // Fetch user's payments
   const payments = await supabase
     .from('pi_payments')
     .select('*')
     .eq('user_id', userId);
   ```

3. **Implement refunds:**
   ```typescript
   // If needed
   const result = await pi.cancelPayment(paymentId);
   ```

4. **Monitor payments:**
   - Set up Supabase database alerts
   - Create dashboard for payment analytics
   - Track payment success rates

---

## Support Resources

- **Pi Documentation:** https://developers.minepi.com
- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions
- **TypeScript Guide:** https://www.typescriptlang.org/docs

For issues, check:
1. Browser console for errors
2. Supabase edge function logs
3. Database pi_payments table
4. Network requests in F12 DevTools
