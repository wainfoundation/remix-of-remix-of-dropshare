# Pi Network Implementation Guide

## Quick Start

### 1. Pi Authentication (Sign In)

Use the `PiSignInButton` component in your login page:

```tsx
import { PiSignInButton } from '@/components/PiSignInButton';

export function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <PiSignInButton />
    </div>
  );
}
```

Or use the hook directly:

```tsx
import { usePiAuth } from '@/hooks/use-pi-auth';

export function MyComponent() {
  const { isAuthenticated, user, authenticate, logout } = usePiAuth();

  return (
    <>
      {isAuthenticated ? (
        <p>Welcome, {user?.username}</p>
      ) : (
        <button onClick={() => authenticate(['username', 'payments'])}>
          Sign In with Pi
        </button>
      )}
    </>
  );
}
```

### 2. Pi AdNetwork - Interstitial Ads

Show full-screen ads at natural break points:

```tsx
import { PiAdComponent } from '@/components/PiAdComponent';

export function GamePage() {
  return (
    <div>
      <h1>Game</h1>
      {/* Show ad after completing a level */}
      <PiAdComponent 
        type="interstitial"
        label="Continue"
      />
    </div>
  );
}
```

Or use the hook:

```tsx
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';

export function MyComponent() {
  const { showInterstitial } = usePiAdNetwork();

  const handleAction = async () => {
    await showInterstitial();
    // Continue with action
  };

  return <button onClick={handleAction}>Do Action</button>;
}
```

### 3. Pi AdNetwork - Rewarded Ads

Reward users for watching ads:

```tsx
import { PiAdComponent } from '@/components/PiAdComponent';

export function RewardPage() {
  const handleReward = async () => {
    // Grant reward to user
    console.log('Rewarding user...');
  };

  return (
    <PiAdComponent
      type="rewarded"
      onReward={handleReward}
      label="Watch Ad for Bonus"
    />
  );
}
```

### 4. Pi Payments

Accept Pi payments from users:

```tsx
import { PiPaymentButton } from '@/components/PiPaymentButton';

export function StorePage() {
  const handlePaymentSuccess = () => {
    console.log('Payment received!');
  };

  return (
    <PiPaymentButton
      amount={3.14}
      memo="Digital Product - Item #123"
      metadata={{ productId: '123', itemName: 'Exclusive Content' }}
      onSuccess={handlePaymentSuccess}
      label="Buy for 3.14 Pi"
    />
  );
}
```

Or use the hook for more control:

```tsx
import { usePiPayment } from '@/hooks/use-pi-payment';

export function CheckoutPage() {
  const { createPayment, isProcessing, error } = usePiPayment();

  const handleCheckout = async () => {
    try {
      await createPayment(
        10.0,
        'Premium Subscription',
        { subscriptionType: 'monthly' }
      );
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  return (
    <>
      <button onClick={handleCheckout} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Checkout'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </>
  );
}
```

## Implementation Examples

### Example 1: Social Media Feed with Ads

```tsx
// Explore.tsx with ad placement every 6 posts
import { PiAdComponent } from '@/components/PiAdComponent';

export function ExploreFeed() {
  const posts = /* fetch posts */;

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post, index) => (
        <div key={post.id}>
          <PostCard post={post} />
          {/* Show ad every 6 posts */}
          {(index + 1) % 6 === 0 && (
            <div className="col-span-3 py-6">
              <PiAdComponent type="interstitial" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Premium Content Unlock with Ads

```tsx
// PremiumContent component
export function PremiumContent() {
  const [unlockedFree, setUnlockedFree] = useState(false);

  const handleWatchAd = async () => {
    // After watching rewarded ad
    setUnlockedFree(true);
  };

  if (unlockedFree) {
    return <div>Premium content unlocked!</div>;
  }

  return (
    <PiAdComponent
      type="rewarded"
      onReward={handleWatchAd}
      label="Watch Ad to Unlock"
    />
  );
}
```

### Example 3: Monetize Product Sales

```tsx
// ProductPage component
export function ProductPage({ productId }) {
  const product = /* fetch product */;

  const handlePurchase = () => {
    // Product is now purchased
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: {product.price} Pi</p>
      <PiPaymentButton
        amount={product.price}
        memo={`Purchase - ${product.name}`}
        metadata={{ productId, category: product.category }}
        onSuccess={handlePurchase}
      />
    </div>
  );
}
```

### Example 4: Login Page with Pi Auth

```tsx
// Already implemented in Login.tsx
import { PiSignInButton } from '@/components/PiSignInButton';

export function LoginPage() {
  return (
    <div className="login-form">
      <h1>Sign In</h1>
      {/* Traditional login form */}
      <form>
        {/* email and password fields */}
      </form>

      <div className="divider">Or continue with</div>

      {/* Pi Network Sign In */}
      <PiSignInButton />
    </div>
  );
}
```

## Architecture

### File Structure
```
src/
├── integrations/pi/
│   ├── init.ts           # SDK initialization
│   ├── auth.ts           # Authentication
│   ├── adnetwork.ts      # Ad Network
│   ├── payments.ts       # Payments (NEW)
│   └── index.ts          # Exports
├── hooks/
│   ├── use-pi-auth.ts        # Auth hook
│   ├── use-pi-adnetwork.ts   # Ad hook
│   └── use-pi-payment.ts     # Payment hook (NEW)
└── components/
    ├── PiSignInButton.tsx    # Sign in button (NEW)
    ├── PiAdComponent.tsx     # Ad component (NEW)
    └── PiPaymentButton.tsx   # Payment button (NEW)
```

### SDK Initialization Flow

1. **App.tsx** initializes Pi SDK on load
2. SDK script loads from `https://sdk.minepi.com/pi-sdk.js`
3. SDK auto-detects if running in Pi Browser
4. If not in Pi Browser, gracefully fails with warning
5. Components check SDK availability and hide if not supported

### Feature Detection

All components automatically:
- Check if running in Pi Browser
- Check if features are supported (ads, payments)
- Hide UI if not available
- Gracefully degrade functionality

## Backend Integration

### Verify Rewarded Ads

Create endpoint: `POST /api/pi/verify-ad`

```typescript
// Backend handler
export async function verifyRewardedAd(adId: string) {
  const response = await fetch(
    `https://api.minepi.com/v2/ads/${adId}/status`,
    {
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
      },
    }
  );

  const data = await response.json();
  return data.mediator_ack_status === 'granted';
}
```

### Approve Payments

Create endpoint: `POST /api/pi/approve-payment`

```typescript
export async function approvePayment(paymentId: string) {
  const response = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/approve`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
      },
    }
  );
  
  return response.json();
}
```

### Complete Payments

Create endpoint: `POST /api/pi/complete-payment`

```typescript
export async function completePayment(paymentId: string, txid: string) {
  const response = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/complete`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
      },
      body: JSON.stringify({ txid }),
    }
  );
  
  return response.json();
}
```

## Configuration

### Environment Variables

```env
VITE_PI_SDK_SANDBOX=true
VITE_PI_API_KEY=your_api_key_here
```

### Developer Portal Settings

1. Go to `develop.pi` in Pi Browser
2. Select your app
3. Enable "Ad Network" in Dev Ad Network settings
4. (Optional) Enable "Loading Banner Ads"
5. Set production and development URLs

## Best Practices

### Ads
- Place interstitials at natural breaks (level complete, screen transitions)
- Limit ads to reasonable frequency (max 1 per 5 minutes)
- Always verify rewarded ads on backend before granting rewards
- Handle "ADS_NOT_SUPPORTED" gracefully (outdated Pi Browser)

### Payments
- Always verify payments on backend before granting items
- Store transaction details for auditing
- Implement proper error handling
- Test thoroughly in sandbox mode first

### User Experience
- Don't force ads on users too frequently
- Reward ads should reward meaningful content
- Make payment buttons clear and prominent
- Show loading states during async operations
- Handle network errors gracefully

## Troubleshooting

**Ads not showing:**
- Verify app is approved for Dev Ad Network
- Check ads are enabled in Developer Portal
- Ensure Pi Browser is up to date
- Test in sandbox mode first

**Payments failing:**
- Verify wallet is created in Pi Browser
- For testnet: check Test-Pi balance
- For mainnet: check KYC and Pi balance
- Verify backend endpoints are configured

**SDK not loading:**
- Check if running in Pi Browser
- Verify SDK script loads: `window.Pi` should exist
- Check browser console for errors
- Test in sandbox if available

## Next Steps

1. ✅ Implement Pi Auth in Login (DONE)
2. ✅ Add ads to Explore page (DONE)
3. Add payment buttons to store/products
4. Create backend verification endpoints
5. Test in Pi Browser sandbox
6. Submit app for Dev Ad Network approval
7. Deploy to production

## Documentation Links

- [Pi Developer Guide](https://pi-apps.github.io/community-developer-guide/)
- [Ads Documentation](https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md)
- [Payments Documentation](https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md)
- [SDK Reference](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md)
