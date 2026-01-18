# Pi Payment Flow - Complete Implementation Guide

## Overview

The Pi payment system is now fully integrated with both frontend React hooks and backend Supabase edge functions. This guide explains how the payment flow works end-to-end.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component                           │
│  (uses usePiIntegration hook)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ Option 1: Simple Payment
                       │  └─ createPayment(paymentData, callbacks)
                       │
                       └─ Option 2: Managed Payment Flow
                          └─ handlePaymentFlow(paymentData, callbacks)
                             └─ Creates callbacks automatically
                                
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              Pi JavaScript SDK (window.Pi)                   │
│  • Handles payment UI                                        │
│  • Collects user approval                                    │
│  • Manages transaction signing                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ Calls Callbacks
                       
┌──────────────────────────────────────────────────────────────┐
│                Callback Handlers (Backend)                   │
│  • onReadyForServerApproval()                               │
│  • onReadyForServerCompletion(txid)                         │
│  • onCancel()                                                │
│  • onError()                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ Calls approvePaymentWithBackend()
                       ├─ Calls completePaymentWithBackend()
                       └─ Uses verifyPaymentWithBackend()
                       
                       ▼
┌──────────────────────────────────────────────────────────────┐
│         Supabase Edge Function: /pi-payment                  │
│  • Receives: action, paymentId, txid, metadata              │
│  • Validates environment                                     │
│  • Calls Pi API v2 endpoints                                │
│  • Stores payment records in database                       │
│  • Returns results to frontend                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ POST /v2/payments/{id}/approve
                       ├─ POST /v2/payments/{id}/complete
                       ├─ GET /v2/payments/{id}
                       ├─ POST /v2/payments/{id}/cancel
                       └─ GET /v2/payments/incomplete_server_payments
                       
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              Pi Network API (v2 Endpoints)                   │
│  • Confirms payment on Pi blockchain                        │
│  • Updates payment status                                    │
│  • Returns transaction ID                                    │
└──────────────────────────────────────────────────────────────┘
```

## Usage Patterns

### Pattern 1: Managed Payment Flow (RECOMMENDED)

The `handlePaymentFlow` method automatically manages the entire payment lifecycle:

```typescript
const { handlePaymentFlow } = usePiIntegration();

const handlePayment = async () => {
  try {
    await handlePaymentFlow(
      {
        amount: 10,
        memo: "Premium Content Purchase",
        metadata: {
          product_id: "premium_001",
          user_email: "user@example.com"
        }
      },
      {
        onApprovalSuccess: () => {
          console.log('✅ Payment approved by server');
          setStatus('Payment approved');
        },
        onCompletionSuccess: () => {
          console.log('✅ Payment completed successfully');
          setStatus('Payment complete!');
          // Grant premium access here
        },
        onError: (error) => {
          console.error('❌ Payment error:', error);
          setStatus(`Error: ${error}`);
        }
      }
    );
  } catch (error) {
    console.error('Payment flow failed:', error);
  }
};
```

**Advantages:**
- ✅ Callbacks created automatically
- ✅ Proper error handling built-in
- ✅ Minimal boilerplate code
- ✅ Handles all payment stages

**When to use:** Most common use case for straightforward payments

---

### Pattern 2: Direct Payment with Custom Callbacks

For more control over payment handling:

```typescript
const { createPayment } = usePiIntegration();

const handlePayment = async () => {
  try {
    const payment = await createPayment(
      {
        amount: 10,
        memo: "In-App Purchase",
        metadata: { item_id: "item_123" }
      },
      {
        onReadyForServerApproval: async (paymentId) => {
          console.log('Payment ready for approval:', paymentId);
          
          // Call your own approval logic
          const response = await fetch('/api/approve-payment', {
            method: 'POST',
            body: JSON.stringify({ paymentId })
          });
          
          if (!response.ok) {
            throw new Error('Approval failed');
          }
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log('Payment ready for completion:', paymentId, txid);
          
          // Call your own completion logic
          const response = await fetch('/api/complete-payment', {
            method: 'POST',
            body: JSON.stringify({ paymentId, txid })
          });
          
          if (!response.ok) {
            throw new Error('Completion failed');
          }
        },

        onCancel: (paymentId) => {
          console.log('User cancelled payment:', paymentId);
          setStatus('Payment cancelled by user');
        },

        onError: (error, payment) => {
          console.error('Payment error:', error);
          setStatus(`Error: ${error.message}`);
        }
      }
    );
  } catch (error) {
    console.error('Payment creation failed:', error);
  }
};
```

**Advantages:**
- ✅ Full control over callbacks
- ✅ Can implement custom approval logic
- ✅ Can use different backend endpoints
- ✅ Advanced error handling

**When to use:** Custom payment workflows, complex logic

---

### Pattern 3: Using Helper Functions Directly

For granular control or testing:

```typescript
const { approvePayment, completePayment, verifyPayment } = usePiIntegration();

// Step 1: Approve (when user selects payment method)
const result1 = await approvePayment(
  'payment-uuid-here',
  10,
  'Product Purchase'
);

// Step 2: Complete (when Pi SDK returns transaction ID)
const result2 = await completePayment(
  'payment-uuid-here',
  'transaction-id-from-pi'
);

// Step 3: Verify (to confirm final status)
const result3 = await verifyPayment('payment-uuid-here');
console.log('Payment status:', result3.status); // 'completed' | 'approved' | 'pending'
```

**Advantages:**
- ✅ Maximum control
- ✅ Easy to test each step
- ✅ Can retry individual steps
- ✅ Full debugging visibility

**When to use:** Testing, debugging, complex workflows

---

## Payment Helper Functions

All payment operations are provided by `src/lib/pi-payment-helper.ts`:

### `approvePaymentWithBackend()`

Calls the `/pi-payment` edge function with action: `approve`

```typescript
const result = await approvePaymentWithBackend(
  'payment-id',
  'user-id',
  10,
  'Payment memo',
  { custom: 'metadata' }
);

if (result.success) {
  console.log('✅ Payment approved:', result.payment);
} else {
  console.error('❌ Error:', result.error);
}
```

**Response:**
```typescript
{
  success: boolean;
  payment?: {
    id: string;
    status: string;
    // ... payment details
  };
  error?: string;
}
```

---

### `completePaymentWithBackend()`

Calls the `/pi-payment` edge function with action: `complete`

```typescript
const result = await completePaymentWithBackend(
  'payment-id',
  'transaction-id-from-pi',
  'user-id'
);

if (result.success) {
  console.log('✅ Payment completed');
} else {
  console.error('❌ Error:', result.error);
}
```

**Important:** The `txid` must come from the Pi SDK's `onReadyForServerCompletion` callback

---

### `verifyPaymentWithBackend()`

Checks payment status on Pi API

```typescript
const result = await verifyPaymentWithBackend('payment-id');

console.log(result.status); // 'completed' | 'approved' | 'pending'
console.log(result.verified); // true | false
```

**Response:**
```typescript
{
  success: boolean;
  status: 'completed' | 'approved' | 'pending';
  verified: boolean;
  payment?: any;
  error?: string;
}
```

---

### `cancelPaymentWithBackend()`

Cancels an incomplete payment

```typescript
const result = await cancelPaymentWithBackend('payment-id');

if (result.success) {
  console.log('✅ Payment cancelled');
} else {
  console.error('❌ Error:', result.error);
}
```

---

### `getIncompletePayments()`

Retrieves list of incomplete payments (for recovery)

```typescript
const result = await getIncompletePayments();

if (result.success) {
  result.payments?.forEach(payment => {
    console.log(`Payment ${payment.id} is incomplete`);
  });
} else {
  console.error('❌ Error:', result.error);
}
```

---

### `handleCompletePaymentFlow()`

Helper that creates properly configured callbacks

```typescript
const { createPaymentCallbacks } = await handleCompletePaymentFlow(
  {
    amount: 10,
    memo: 'Purchase',
    metadata: { item: 'premium' }
  },
  () => console.log('Approved'),
  () => console.log('Completed'),
  (error) => console.error('Error:', error)
);

// Then use with createPayment:
await createPayment(paymentData, createPaymentCallbacks);
```

---

## Environment Configuration

### Required Environment Variables

In your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Required Supabase Secrets

In Supabase dashboard → Settings → Edge Functions:

```
PI_API_KEY=your-pi-api-key-from-pi-dashboard
```

---

## Database Schema

The payment helper expects a `pi_payments` table:

```sql
CREATE TABLE pi_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  amount_pi DECIMAL(10, 6) NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'approved', 'completed', 'cancelled'
  txid TEXT, -- Transaction ID from Pi network
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

## Payment Status Flow

```
User Opens App
     │
     ▼
User Clicks "Pay"
     │
     ▼
Pi SDK Payment UI Opens ─────────────────┐
     │                                   │
     ├─ User selects payment method      │
     ├─ User confirms amount             │
     └─ Pi SDK starts transaction        │
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │ Pi API creates payment  │
                          │ Status: PENDING         │
                          └────────┬────────────────┘
                                   │
                                   ▼
                          onReadyForServerApproval()
                          (frontend calls backend)
                                   │
                                   ▼
                          ┌─────────────────────────┐
                          │ Backend calls Pi API    │
                          │ POST /approve           │
                          │ Status: APPROVED        │
                          └────────┬────────────────┘
                                   │
                                   ▼
                          Pi SDK completes signing
                          Returns transaction ID
                                   │
                                   ▼
                          onReadyForServerCompletion(txid)
                          (frontend calls backend)
                                   │
                                   ▼
                          ┌─────────────────────────┐
                          │ Backend calls Pi API    │
                          │ POST /complete with txid│
                          │ Status: COMPLETED       │
                          └────────┬────────────────┘
                                   │
                                   ▼
                          ✅ Payment Successful
                          Grant access/award
```

---

## Error Handling

### Common Errors and Solutions

#### "Pi SDK not initialized"
- **Cause:** Hook mounted before Pi SDK loaded
- **Solution:** Check that index.html includes Pi SDK script before React app loads

#### "Payment approval failed"
- **Cause:** Invalid paymentId or network error
- **Solution:** 
  1. Check paymentId format
  2. Verify SUPABASE_URL and SUPABASE_ANON_KEY
  3. Check Supabase edge function logs

#### "Payment completion failed"
- **Cause:** Invalid txid or timing issue
- **Solution:**
  1. Ensure txid comes from onReadyForServerCompletion
  2. Don't call complete before approve completes
  3. Check PI_API_KEY secret in Supabase

#### "Verification failed"
- **Cause:** Payment not found or network timeout
- **Solution:**
  1. Wait a moment before verifying
  2. Check paymentId is correct
  3. Verify payment exists in database

### Debugging

Enable detailed logging:

```typescript
// In your component
const { error, handlePaymentFlow } = usePiIntegration();

useEffect(() => {
  if (error) {
    console.error('🔴 Pi Integration Error:', error);
  }
}, [error]);

// Check browser console for detailed logs with [Payment Helper] prefix
// All payment operations log their state
```

---

## Testing

### Manual Test Flow

1. **Open app in Pi Browser** (mainnet or testnet)
2. **Authenticate** via login button
3. **Click "Try Payment"** in demo
4. **Select payment method** when Pi SDK prompts
5. **Watch browser console** for approval/completion logs
6. **Verify payment in database** (Supabase dashboard → pi_payments table)

### Automated Testing

```typescript
// Example test
const { handlePaymentFlow } = usePiIntegration();

const testPayment = async () => {
  try {
    await handlePaymentFlow(
      {
        amount: 1, // Use small amount for testing
        memo: 'Test Payment',
        metadata: { test: true }
      },
      {
        onApprovalSuccess: () => console.log('✅ Test approval passed'),
        onCompletionSuccess: () => console.log('✅ Test completion passed'),
        onError: (err) => console.error('❌ Test failed:', err)
      }
    );
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

---

## Best Practices

### 1. **Always Use Callbacks**
```typescript
// ✅ Good - handles all payment stages
await handlePaymentFlow(paymentData, {
  onApprovalSuccess: () => { /* handle */ },
  onCompletionSuccess: () => { /* handle */ },
  onError: (error) => { /* handle */ }
});

// ❌ Bad - ignores payment progress
await handlePaymentFlow(paymentData);
```

### 2. **Verify Before Granting Access**
```typescript
// ✅ Good
const result = await verifyPayment(paymentId);
if (result.verified && result.status === 'completed') {
  grantPremiumAccess();
}

// ❌ Bad - assumes payment succeeded
grantPremiumAccess();
```

### 3. **Store Payment Metadata**
```typescript
// ✅ Good - easy to track
await handlePaymentFlow(
  {
    amount: 10,
    memo: 'Premium Access',
    metadata: {
      product_id: 'premium_001',
      user_email: 'user@example.com',
      purchase_date: new Date().toISOString()
    }
  }
);

// ❌ Bad - can't track purchases
await handlePaymentFlow({
  amount: 10,
  memo: 'Premium Access'
});
```

### 4. **Handle Network Timeouts**
```typescript
// ✅ Good - with timeout
const completeWithTimeout = async () => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 30000)
  );
  
  return Promise.race([
    completePayment(paymentId, txid),
    timeout
  ]);
};

// ❌ Bad - can hang indefinitely
await completePayment(paymentId, txid);
```

### 5. **Implement Recovery**
```typescript
// ✅ Good - recover incomplete payments on startup
useEffect(() => {
  const recoverPayments = async () => {
    const result = await getIncompletePayments();
    if (result.success && result.payments?.length > 0) {
      console.log('Found incomplete payments:', result.payments);
      // Attempt recovery...
    }
  };
  
  recoverPayments();
}, []);
```

---

## Troubleshooting Checklist

- [ ] Pi SDK script loaded in index.html
- [ ] App opened in Pi Browser (not regular browser)
- [ ] User authenticated before attempting payment
- [ ] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set correctly
- [ ] PI_API_KEY secret configured in Supabase
- [ ] pi-payment edge function deployed and working
- [ ] pi_payments table created in database
- [ ] Browser console shows detailed payment logs
- [ ] Payment callbacks implemented for all stages
- [ ] Network connectivity verified

---

## Next Steps

1. **Set up database table** using the SQL schema above
2. **Configure PI_API_KEY** in Supabase secrets
3. **Deploy pi-payment edge function** to Supabase
4. **Test with PiIntegrationDemo** component
5. **Monitor logs** in Supabase dashboard
6. **Implement recovery logic** for incomplete payments

For questions or issues, check the console logs - all operations include [Payment Helper] or [Payment Flow] prefixes for easy debugging.
