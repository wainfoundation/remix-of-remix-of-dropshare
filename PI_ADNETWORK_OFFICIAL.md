# Pi Ad Network - Official Implementation Guide

**Based on**: [Pi Platform Docs - Ads](https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md)

---

## 📋 Overview

Pi App Platform provides three types of ads:
1. **Interstitial Ads** - Full-screen ads at natural transition points
2. **Rewarded Ads** - Full-screen ads users watch for rewards
3. **Banner Ads** - Overlay ads at top/bottom (Loading Banner Ads via Developer Portal)

---

## 🔐 Prerequisites

### 1. Developer Ad Network Application
- Application must be approved by Pi Core Team to receive monetization rewards
- Apply via [Pi Developer Portal](https://develop.pinet.com)
- Some methods return different responses based on approval status

### 2. Ad Network Support Check
Check if user's Pi Browser supports Ad Network:

```typescript
import Pi from '@pi-sdk/core';

const checkAdNetworkSupport = async () => {
  await Pi.init({ version: "2.0" });
  const nativeFeaturesList = await Pi.nativeFeaturesList();
  const adNetworkSupported = nativeFeaturesList.includes("ad_network");
  return adNetworkSupported;
};
```

**Important**: If `ad_network` is missing or promises return `"ADS_NOT_SUPPORTED"`, user has an outdated Pi Browser.

---

## 📚 SDK Methods

### Pi.Ads.showAd(adType)
Display an ad to the user.

```typescript
// Interstitial
const response = await Pi.Ads.showAd("interstitial");
// Response: { result: "AD_CLOSED" | "AD_CANCELED" | "ADS_NOT_SUPPORTED" | ... }

// Rewarded
const response = await Pi.Ads.showAd("rewarded");
// Response: { 
//   result: "AD_REWARDED" | "AD_CANCELED" | "ADS_NOT_SUPPORTED" | ...
//   adId?: string  // Required for backend verification!
// }
```

### Pi.Ads.isAdReady(adType)
Check if an ad is ready to display.

```typescript
const response = await Pi.Ads.isAdReady("interstitial");
// Response: { ready: true | false }
```

### Pi.Ads.requestAd(adType)
Manually request an ad (e.g., if not auto-loaded).

```typescript
const response = await Pi.Ads.requestAd("rewarded");
// Response: { 
//   result: "AD_LOADED" | "AD_FAILED" | "ADS_NOT_SUPPORTED" | ...
// }
```

---

## 🎯 Implementation Patterns

### Basic Interstitial Ads

```typescript
// At natural transition points (e.g., every 3 game levels)
const completeLevel = async () => {
  // ... game logic ...
  
  if (currentLevel % 3 === 0) {
    await Pi.Ads.showAd("interstitial");
  }
  
  // Continue to next level
};
```

### Advanced Interstitial Ads (Recommended)

```typescript
const showInterstitialAd = async () => {
  try {
    // 1. Check if ad is ready
    const isAdReadyResponse = await Pi.Ads.isAdReady("interstitial");

    if (isAdReadyResponse.ready === false) {
      // 2. Request ad if not ready
      const requestAdResponse = await Pi.Ads.requestAd("interstitial");

      if (requestAdResponse.result === "ADS_NOT_SUPPORTED") {
        // User has outdated Pi Browser
        showUpdateBrowserModal();
        return;
      }

      if (requestAdResponse.result !== "AD_LOADED") {
        // Ad failed to load, try again later
        showAdUnavailableModal();
        return;
      }
    }

    // 3. Show the ad
    const showAdResponse = await Pi.Ads.showAd("interstitial");

    if (showAdResponse.result !== "AD_CLOSED") {
      // Ad was canceled or failed
      return;
    }

    // Ad was successfully shown
    return true;
  } catch (err) {
    console.error("Ad error:", err);
  }
};
```

### Basic Rewarded Ads

```typescript
const showRewardedAd = async () => {
  const showAdResponse = await Pi.Ads.showAd("rewarded");
  
  if (showAdResponse.result === "AD_REWARDED") {
    // Send adId to backend for verification
    const verified = await verifyRewardedAd(showAdResponse.adId);
    if (verified) {
      grantUserReward();
    }
  }
};
```

### Advanced Rewarded Ads (Recommended)

```typescript
const showRewardedAd = async (onReward: () => void) => {
  try {
    // 1. Check if ad is ready
    const isAdReadyResponse = await Pi.Ads.isAdReady("rewarded");

    if (isAdReadyResponse.ready === false) {
      // 2. Request ad if not ready
      const requestAdResponse = await Pi.Ads.requestAd("rewarded");

      if (requestAdResponse.result === "ADS_NOT_SUPPORTED") {
        showUpdateBrowserModal();
        return;
      }

      if (requestAdResponse.result !== "AD_LOADED") {
        showAdUnavailableModal();
        return;
      }
    }

    // 3. Show the ad
    const showAdResponse = await Pi.Ads.showAd("rewarded");

    if (showAdResponse.result === "AD_REWARDED") {
      // ⚠️ IMPORTANT: Verify with backend before rewarding!
      const result = await rewardUserForWatchingRewardedAd(
        showAdResponse.adId
      );
      
      if (result.rewarded === true) {
        showRewardedModal(result.reward);
        onReward();
      } else {
        showRewardFailModal(result.error);
      }
    } else {
      showAdErrorModal();
    }
  } catch (err) {
    console.error("Rewarded ad error:", err);
  }
};
```

---

## 🔒 Backend Verification (Rewarded Ads)

### ⚠️ Critical Security Note

Users might run hacked SDK versions. **Always verify on backend before rewarding**.

### Verify with Pi Platform API

```typescript
// Backend endpoint example
POST https://api.pi.delivery/2/me/ads/{adId}
Authorization: Bearer {app_access_token}

// Response:
{
  "mediator_ack_status": "granted" | "denied" | "pending"
}

// Grant reward ONLY if:
// mediator_ack_status === "granted"
```

### Implementation Example

```typescript
// Backend verification function
const verifyRewardedAd = async (adId: string, userId: string) => {
  try {
    // Verify with Pi Platform API
    const response = await fetch(
      `https://api.pi.delivery/2/me/ads/${adId}`,
      {
        headers: {
          Authorization: `Bearer ${PI_APP_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    if (data.mediator_ack_status === "granted") {
      // Grant the reward
      await database.rewards.create({
        userId,
        adId,
        amount: 10, // Pi tokens
        timestamp: new Date(),
      });
      return { rewarded: true, amount: 10 };
    } else {
      return { rewarded: false, error: "Ad verification failed" };
    }
  } catch (err) {
    console.error("Verification error:", err);
    return { rewarded: false, error: "Verification error" };
  }
};
```

---

## 🎨 Banner Ads (Loading Banner Ads)

Currently, banner ads are **not supported via Pi SDK**. However:

### Enabling Loading Banner Ads
1. Go to [https://develop.pinet.com](https://develop.pinet.com) in Pi Browser
2. Select your application
3. Go to "Dev Ad Network" → "Settings"
4. Toggle "Enable Loading Banner Ads"
5. Clear Pi Browser cache to see changes

These ads display automatically during app load and are managed by Pi Browser.

---

## 🏗️ DropShare Implementation

### Current Integration

**File**: [src/hooks/use-pi-adnetwork.ts](src/hooks/use-pi-adnetwork.ts)

```typescript
export const usePiAdNetwork = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interstitialReady, setInterstitialReady] = useState(false);
  const [rewardedReady, setRewardedReady] = useState(false);

  // Check support on mount
  useEffect(() => {
    checkAdNetworkSupport();
  }, []);

  // Methods match official SDK API
  const showInterstitial = async () => {
    if (!isSupported) return false;
    const response = await Pi.Ads.showAd("interstitial");
    return response.result === "AD_CLOSED";
  };

  const showRewarded = async (onReward?: () => void) => {
    if (!isSupported) return;
    const response = await Pi.Ads.showAd("rewarded");
    if (response.result === "AD_REWARDED" && onReward) {
      onReward();
    }
  };

  const isAdReady = async (type: "interstitial" | "rewarded") => {
    const response = await Pi.Ads.isAdReady(type);
    return response.ready;
  };

  const requestAd = async (type: "interstitial" | "rewarded") => {
    const response = await Pi.Ads.requestAd(type);
    return response.result === "AD_LOADED";
  };

  return {
    isSupported,
    isLoading,
    showInterstitial,
    showRewarded,
    isAdReady,
    requestAd,
    interstitialReady,
    rewardedReady,
  };
};
```

### Feed Integration

**File**: [src/pages/Index.tsx](src/pages/Index.tsx)

```tsx
// Banner ads every 3 posts (non-SDK, custom implementation)
{posts.map((post, index) => (
  <div key={post.id}>
    {index > 0 && index % 3 === 0 && <PiBannerAd className="my-4" />}
    <PostCard post={post} />
  </div>
))}

// Interstitial ads every 2 minutes (auto-trigger at natural breaks)
useEffect(() => {
  const timer = setInterval(async () => {
    await showInterstitialAd();
  }, 120000); // 2 minutes
  return () => clearInterval(timer);
}, [showInterstitialAd]);
```

### Ad Components

| Component | Type | File |
|-----------|------|------|
| PiBannerAd | Custom | [src/components/PiBannerAd.tsx](src/components/PiBannerAd.tsx) |
| PiInterstitialAd | Interstitial (SDK) | [src/components/PiInterstitialAd.tsx](src/components/PiInterstitialAd.tsx) |
| PiRewardedAd | Rewarded (SDK) | [src/components/PiRewardedAd.tsx](src/components/PiRewardedAd.tsx) |

---

## 🚀 Best Practices

### Do's ✅
- Check `ad_network` in `nativeFeaturesList()` before showing ads
- Use advanced flow with `isAdReady()` and `requestAd()`
- Always verify rewarded ads on backend before granting reward
- Show ads at natural transition points (level ends, between sections, etc.)
- Preload ads during non-critical moments
- Handle all possible response types

### Don'ts ❌
- Don't show ads during critical user interactions
- Don't show interstitials consecutively without content in between
- Don't reward users without backend verification
- Don't ignore `ADS_NOT_SUPPORTED` responses
- Don't hardcode reward amounts (verify from backend)
- Don't show ads to unauthenticated users (rewarded ads only)

---

## 📊 Ad Placement Strategy

### Interstitial Ads
- **Best Places**: Between game levels, after completing a task, between content sections
- **Frequency**: Every 3+ levels/sections
- **Duration**: User closes when ready
- **Revenue**: Per impression

### Rewarded Ads
- **Best Places**: When user needs extra resources, wants premium features, or runs out of free resources
- **Frequency**: User-initiated (always)
- **Requirement**: User must be authenticated
- **Revenue**: Per completion + verification
- **Security**: Must verify `adId` with Pi Platform API

### Banner Ads
- **Best Places**: Top or bottom of content (non-intrusive)
- **Frequency**: Continuous (always visible)
- **Configuration**: Developer Portal → Enable Loading Banner Ads
- **Note**: Currently only "Loading Banner Ads" supported

---

## 🔍 Troubleshooting

### "Ad Network Not Supported"
**Cause**: `ad_network` not in `nativeFeaturesList()`  
**Solution**: User has old Pi Browser. Show update modal.

### Ads Not Showing
**Causes**:
1. App not approved in Pi Developer Network
2. User is on non-Pi Browser
3. Ad network temporarily unavailable
4. App cache needs clearing

**Solutions**:
1. Apply at [https://develop.pinet.com](https://develop.pinet.com)
2. Test in Pi Browser
3. Implement retry logic with `requestAd()`
4. Clear Pi Browser cache

### Reward Verification Failed
**Cause**: Backend verification returned `mediator_ack_status !== "granted"`  
**Solution**: Don't grant reward. Log incident and contact Pi Core Team.

### Multiple Ad Requests
**Problem**: Too many `requestAd()` calls  
**Solution**: Use `isAdReady()` before `requestAd()` to avoid redundant requests

---

## 📖 SDK Reference

For complete method definitions and response types, see:
- [Pi SDK Reference - Ads Section](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md#ads)
- [Pi Platform API - Verify Rewarded Ad](https://github.com/pi-apps/pi-platform-docs/blob/master/platform_API.md#verify-a-rewarded-ad-status)

---

## 🔗 Documentation Links

- **Official Ads Guide**: https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md
- **SDK Reference**: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md
- **Platform API**: https://github.com/pi-apps/pi-platform-docs/blob/master/platform_API.md
- **Developer Portal**: https://develop.pinet.com
- **Pi Browser Sandbox**: Test environment for development

---

## ✅ Implementation Checklist

- [ ] Check Pi Browser support via `nativeFeaturesList()`
- [ ] Implement advanced flow with error handling
- [ ] Show interstitials at natural breakpoints
- [ ] Implement backend verification for rewarded ads
- [ ] Handle all response types (`ADS_NOT_SUPPORTED`, `AD_FAILED`, etc.)
- [ ] Add update browser modal for outdated Pi Browser
- [ ] Preload ads during non-critical moments
- [ ] Add analytics/logging for ad events
- [ ] Apply for Developer Ad Network approval
- [ ] Test in Pi Browser (both mainnet and sandbox)
- [ ] Enable Loading Banner Ads in Developer Portal (optional)
- [ ] Document reward amounts and grant logic

---

**Last Updated**: January 15, 2026  
**Status**: ✅ Based on Official Pi Platform Docs  
**Source**: https://github.com/pi-apps/pi-platform-docs
