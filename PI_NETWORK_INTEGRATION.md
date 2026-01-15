# Pi Network Integration Guide

This guide covers the setup and usage of Pi Network authentication and AdNetwork in the shop-drop-share app.

## Overview

The app includes complete integration with:
- **Pi Auth**: User authentication with the Pi Network
- **Pi AdNetwork**: Display interstitial, rewarded, and banner ads

## Files Created

```
src/
├── integrations/pi/
│   ├── init.ts          # Pi SDK initialization
│   ├── auth.ts          # Authentication functions
│   ├── adnetwork.ts     # AdNetwork functions
│   └── index.ts         # Exports
├── hooks/
│   ├── use-pi-auth.ts        # React hook for auth
│   └── use-pi-adnetwork.ts   # React hook for ads
└── public/
    └── validation-key.txt    # Domain verification file
```

## 1. Pi Authentication Setup

### Initialization

The Pi SDK is automatically initialized in `App.tsx` on app startup:

```tsx
useEffect(() => {
  initPiSdk({
    version: "2.0",
    sandbox: process.env.NODE_ENV === "development",
  }).catch((error) => {
    console.warn("Pi SDK initialization failed:", error);
  });
}, []);
```

### Using Pi Authentication in Components

#### Basic Usage with Hook

```tsx
import { usePiAuth } from "@/hooks/use-pi-auth";

export function LoginPage() {
  const { isAuthenticated, user, authenticate, logout } = usePiAuth();

  const handleLogin = async () => {
    // Request username and payments permissions
    await authenticate(["username", "payments"]);
  };

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.username}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button onClick={handleLogin}>Login with Pi</button>;
}
```

#### Advanced Usage

```tsx
import { authenticateWithPi, logoutFromPi } from "@/integrations/pi";

// Direct authentication
const result = await authenticateWithPi(["username", "payments", "wallet_address"]);
localStorage.setItem("pi_auth_token", result.accessToken);
localStorage.setItem("pi_user_info", JSON.stringify(result.user));

// Check if authenticated
const isAuth = await isPiAuthenticated();

// Get user info
const userInfo = await getPiUserInfo();

// Logout
logoutFromPi();
```

### Available Scopes

- `"username"` - Access user's Pi username
- `"payments"` - Required for making payments
- `"wallet_address"` - Access user's wallet address

## 2. Pi AdNetwork Setup

### Prerequisites

1. **Register your app** at develop.pi in the Pi Browser
2. **Enable AdNetwork** in Developer Portal > Dev Ad Network > Settings
3. **Enable Loading Banner Ads** (optional) from the same settings

### Interstitial Ads

Full-screen ads shown at natural break points (e.g., between levels, screens):

```tsx
import { usePiAdNetwork } from "@/hooks/use-pi-adnetwork";

export function GameComponent() {
  const { isSupported, showInterstitial } = usePiAdNetwork();

  const completeLevel = async () => {
    // Game logic...

    if (isSupported) {
      await showInterstitial();
    }
  };

  return <button onClick={completeLevel}>Complete Level</button>;
}
```

Or using the direct function:

```tsx
import { showInterstitialAd } from "@/integrations/pi";

const success = await showInterstitialAd();
if (success) {
  console.log("Ad displayed successfully");
}
```

### Rewarded Ads

Full-screen ads that reward users for watching (requires authentication):

```tsx
import { usePiAdNetwork } from "@/hooks/use-pi-adnetwork";

export function RewardComponent() {
  const { isSupported, showRewarded } = usePiAdNetwork();

  const grantBonus = async () => {
    // This handles ad verification automatically
    await showRewarded(async () => {
      // This callback runs only if ad was verified
      console.log("Rewarding user...");
      // Update user's account, grant bonus, etc.
    });
  };

  return <button onClick={grantBonus}>Watch Ad for Bonus</button>;
}
```

Or with manual verification:

```tsx
import { showRewardedAd, verifyRewardedAdOnBackend } from "@/integrations/pi";

const result = await showRewardedAd();

if (result.rewarded && result.adId) {
  // Verify on your backend before rewarding
  const isValid = await verifyRewardedAdOnBackend(result.adId);
  if (isValid) {
    // Grant reward to user
  }
}
```

### Banner Ads

Banner ads are currently supported via Loading Banner Ads only. Enable in Developer Portal settings - they display automatically while your app loads.

### Checking Ad Network Support

```tsx
import { isAdNetworkSupported } from "@/integrations/pi";

const supported = await isAdNetworkSupported();
if (!supported) {
  console.log("Please update Pi Browser to see ads");
}
```

## 3. Domain Verification

A `validation-key.txt` file has been created in the `public/` directory for domain verification.

**Path**: `https://shop-drop-share.lovable.app/validation-key.txt`

**Content**: 
```
PI-API-KEY 6c7579329602523b9faee323edce439d8c046d9d4a90fc2774f932ae64c8800334996303f0a34a5b92c8ebfc9ee9fff6140715d306feed931813637632751388
```

This file proves your domain ownership when registering the app in Developer Portal.

## 4. Backend Integration

### Verify Rewarded Ads (Required for Security)

**IMPORTANT**: Always verify rewarded ads on your backend before granting rewards. This prevents fraud from hacked SDK versions.

Backend API endpoint example:

```typescript
// Backend: POST /api/pi/verify-ad
// Request: { adId: string }
// Response: { mediator_ack_status: "granted" | "denied" }

// Call from frontend:
const response = await fetch("/api/pi/verify-ad", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ adId }),
});
const data = await response.json();
const isValid = data.mediator_ack_status === "granted";
```

Use the Pi Platform API to verify:
```
POST https://api.minepi.com/v2/ads/{adId}/status
Authorization: Bearer YOUR_API_KEY
```

## 5. Environment Variables

Add to your `.env` file if needed:

```env
VITE_PI_SDK_SANDBOX=true  # Use sandbox in development
VITE_PI_API_KEY=6c7579329602523b9faee323edce439d8c046d9d4a90fc2774f932ae64c8800334996303f0a34a5b92c8ebfc9ee9fff6140715d306feed931813637632751388
```

## 6. Development & Testing

### Using Sandbox Mode

The app automatically enables sandbox mode in development:

```tsx
sandbox: process.env.NODE_ENV === "development"
```

Access sandbox at: `https://sandbox.minepi.com/`

Configure development URL in Developer Portal under your app settings.

### Testing Ads

1. Make sure your app is approved for Dev Ad Network
2. Enable ads in Developer Portal settings
3. Test with interstitial ads first (simpler flow)
4. Test rewarded ads with proper verification

## 7. Security Best Practices

1. **Never trust client-side ad verification** - Always verify on backend
2. **Store API keys securely** - Use environment variables, never hardcode
3. **Implement rate limiting** - Prevent spam ad requests
4. **Verify user ownership** - Use access tokens from Pi.authenticate()
5. **Log all rewards** - Track ad rewards for auditing

## 8. Troubleshooting

### SDK Not Initializing

```
Error: "Pi SDK not initialized"
```

- Make sure app is running in Pi Browser
- Check that SDK script loaded successfully
- Verify no Content Security Policy violations

### Ads Not Showing

- Confirm app is approved for Dev Ad Network
- Check if ads are enabled in Developer Portal
- Verify user has updated Pi Browser
- Check if user is authenticated (for rewarded ads)

### "ADS_NOT_SUPPORTED" Response

- User's Pi Browser version is too old
- Encourage user to update Pi Browser
- Gracefully handle this response in UI

## 9. Resources

- [Pi Network Docs](https://pi-apps.github.io/community-developer-guide/)
- [Ads Documentation](https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md)
- [SDK Reference](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md)
- [Developer Portal](https://develop.pi)

## 10. Next Steps

1. Register app at develop.pi
2. Configure production and development URLs
3. Apply for Dev Ad Network
4. Implement Pi Auth in Login component
5. Add ads to key user journey points
6. Set up backend verification endpoint
7. Test thoroughly in sandbox mode
8. Deploy to production
