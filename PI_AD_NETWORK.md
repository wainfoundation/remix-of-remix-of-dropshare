# Pi Ad Network Implementation for DropShare

## Overview

The Pi Ad Network has been fully integrated into DropShare with three main ad formats:
1. **Banner Ads** - Displayed between posts in the feed
2. **Interstitial Ads** - Full-screen ads at natural break points
3. **Rewarded Ads** - User opt-in ads for earning rewards

This implementation follows the same pattern as Facebook, Instagram, and other major social networks.

## Components

### 1. PiBannerAd Component
**File**: `src/components/PiBannerAd.tsx`

Banner ads that appear naturally in the feed, similar to Facebook/Instagram.

**Usage**:
```tsx
import PiBannerAd from '@/components/PiBannerAd';

<PiBannerAd 
  className="my-4"
  showLabel={true}
/>
```

**Features**:
- Displays every 3 posts in the feed
- Users can hide individual ads
- Non-intrusive native ad format
- Automatically adapts to dark/light mode

### 2. PiInterstitialAd Component
**File**: `src/components/PiInterstitialAd.tsx`

Full-screen ads shown at natural transition points.

**Usage**:
```tsx
import PiInterstitialAd from '@/components/PiInterstitialAd';

const [showInterstitial, setShowInterstitial] = useState(false);

<PiInterstitialAd 
  isOpen={showInterstitial}
  onClose={() => setShowInterstitial(false)}
  isLoading={false}
/>
```

**Features**:
- Modal overlay with close button
- Shows automatically every 2 minutes on the feed
- Can be triggered on page navigation
- Smooth animations

### 3. PiRewardedAd Component
**File**: `src/components/PiRewardedAd.tsx`

Opt-in ads that reward users for watching.

**Usage**:
```tsx
import PiRewardedAd from '@/components/PiRewardedAd';

const [showRewarded, setShowRewarded] = useState(false);

const handleReward = async () => {
  // Grant reward to user
  console.log('User earned reward!');
};

<PiRewardedAd 
  isOpen={showRewarded}
  onClose={() => setShowRewarded(false)}
  onReward={handleReward}
  rewardLabel="10 Pi"
/>
```

**Features**:
- User-initiated ad viewing
- Customizable reward label
- Success state after reward
- Server-side verification support

## Hook: usePiAdNetwork

**File**: `src/hooks/use-pi-adnetwork.ts`

React hook for managing all ad operations.

**Return Type**:
```typescript
interface UsePiAdNetworkReturn {
  isSupported: boolean;        // Is Pi Ad Network supported
  isLoading: boolean;          // Initial loading state
  interstitialReady: boolean;  // Is interstitial ad ready
  rewardedReady: boolean;      // Is rewarded ad ready
  showInterstitial: () => Promise<boolean>;
  showRewarded: (onReward?: () => Promise<void> | void) => Promise<void>;
  preloadInterstitial: () => Promise<void>;
  preloadRewarded: () => Promise<void>;
}
```

**Example**:
```typescript
const { 
  isSupported, 
  showInterstitial, 
  showRewarded,
  preloadInterstitial 
} = usePiAdNetwork();

// Show interstitial ad
if (isSupported) {
  await showInterstitial();
}

// Preload ad for later
await preloadInterstitial();
```

## Implementation Details

### Ad Network Module
**File**: `src/integrations/pi/adnetwork.ts`

Core Pi Ad Network integration functions:

```typescript
// Check if ad network is supported
await isAdNetworkSupported(): Promise<boolean>

// Check if ad is ready
await isAdReady(type: 'interstitial' | 'rewarded'): Promise<boolean>

// Request ad to be loaded
await requestAd(type: 'interstitial' | 'rewarded'): Promise<string>

// Show interstitial ad (full-screen)
await showInterstitialAd(): Promise<boolean>

// Show rewarded ad (user opt-in)
await showRewardedAd(): Promise<{ rewarded: boolean; adId?: string }>

// Verify rewarded ad on backend (for fraud prevention)
await verifyRewardedAdOnBackend(adId: string): Promise<boolean>

// Handle complete rewarded ad flow
await handleRewardedAdFlow(onReward: () => Promise<void> | void): Promise<boolean>
```

## Integration Points

### 1. Feed (Home Page)
**File**: `src/pages/Index.tsx`

- Banner ads show every 3 posts
- Interstitial ads appear every 2 minutes automatically

```tsx
{posts.map((post, index) => (
  <div key={post.id}>
    {index > 0 && index % 3 === 0 && <PiBannerAd />}
    <PostCard post={post} {...props} />
  </div>
))}
```

### 2. Ads Demo Page
**File**: `src/pages/AdsDemo.tsx`

A showcase page demonstrating all ad formats at `/ads-demo`

**Visit**: http://localhost:5173/ads-demo to see:
- Banner ad examples
- Interstitial ad demo
- Rewarded ad demo
- Integration details

## Configuration

### Supported Ad Networks
The implementation uses the Pi Network Ad Network, which is automatically detected and loaded through:

1. **Pi SDK**: `window.Pi.Ads` namespace
2. **Native Features**: Checks for "ad_network" in native features list
3. **Automatic Preloading**: Ads are preloaded for better UX

### Ad Types and Placement

| Ad Type | Placement | Frequency | User Control |
|---------|-----------|-----------|--------------|
| Banner | In feed | Every 3 posts | Can hide |
| Interstitial | Page transitions | Every 2 min | None (brief) |
| Rewarded | User triggered | On demand | User initiated |

## Best Practices

### 1. Don't Show Too Many Ads
- Banner: Every 3-4 posts maximum
- Interstitial: Every 2+ minutes
- Rewarded: Always user-initiated

### 2. Preload Ads
Use preloading hooks to ensure ads are ready:
```typescript
const { preloadInterstitial } = usePiAdNetwork();

// Preload when user lands on page
useEffect(() => {
  preloadInterstitial();
}, []);
```

### 3. Verify Rewarded Ads
Always verify on the backend:
```typescript
const handleReward = async () => {
  const isValid = await verifyRewardedAdOnBackend(adId);
  if (isValid) {
    // Grant reward
  }
};
```

### 4. Graceful Degradation
Check if ads are supported:
```typescript
const { isSupported } = usePiAdNetwork();

if (!isSupported) {
  // Show alternative monetization or nothing
  return null;
}
```

## User Experience

### Ad Behavior
- **Non-intrusive**: Ads don't block content navigation
- **Optional**: Rewarded ads are always opt-in
- **Dismissible**: Banner ads can be hidden
- **Quick**: Interstitial ads close after viewing

### Messaging
All ads include:
- Clear labeling ("Ad", "Sponsored Content", etc.)
- Close/skip buttons where appropriate
- Context about supporting creators

## Monitoring & Analytics

### Track Ad Impressions
Monitor ad display events:
```typescript
const handleAdShown = () => {
  console.log('Ad impression tracked');
  // Send to analytics
};
```

### Track Rewards
Monitor reward grants:
```typescript
const handleReward = async () => {
  // Track reward event
  analytics.trackReward({ type: 'ad', amount: 10 });
};
```

## Backend Integration

### Edge Function: /pi-ads
**File**: `supabase/functions/pi-ads/index.ts`

Handles:
- Ad reward verification
- Server-side validation
- Fraud prevention
- Ad audit logging

**Endpoint**: `POST /functions/v1/pi-ads`

## Testing

### 1. Ad Network Support
```typescript
const { isSupported, isLoading } = usePiAdNetwork();
console.log('Ad Network Supported:', isSupported);
```

### 2. Test All Formats
Visit `/ads-demo` to:
- See banner ads
- Trigger interstitial demo
- Watch rewarded ad flow

### 3. Real Testing
Only works in:
- Pi Browser (production)
- Pi Browser (sandbox with dev account)

## Future Enhancements

1. **Ad Analytics Dashboard**
   - Track impressions, clicks, rewards
   - View ad performance metrics
   - Revenue tracking

2. **Ad Targeting**
   - Demographic targeting
   - Interest-based targeting
   - Creator-specific ad preferences

3. **Reward System**
   - Accumulated rewards
   - Reward marketplace
   - Pi Network integration

4. **Creator Tools**
   - Control ad placement
   - Set minimum ad frequency
   - View ad earnings

## Troubleshooting

### Ads Not Showing
1. Check if running in Pi Browser or sandbox mode
2. Verify Pi SDK is initialized
3. Check browser console for errors
4. Ensure ad network is supported: `isSupported === true`

### Ads Not Loading
1. Check network connection
2. Verify Pi API endpoint availability
3. Check Ad Network API key configuration
4. Preload ads manually

### Verification Fails
1. Check backend Edge Function logs
2. Verify adId format
3. Ensure server-side validation is enabled
4. Check Supabase connection

## Resources

- [Pi Network Ad Network Documentation](https://github.com/pi-apps/pi-platform-docs)
- [Pi Apps Developer Guide](https://pi-apps.github.io/community-developer-guide/)
- [Ad Network Best Practices](https://developers.google.com/admob)

---

**Status**: ✅ Fully Implemented  
**Last Updated**: January 15, 2026  
**Demo Page**: `/ads-demo`
