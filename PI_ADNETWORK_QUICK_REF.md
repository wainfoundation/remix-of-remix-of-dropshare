# Pi Ad Network - Quick Reference

## 📍 Demo & Testing
**Visit**: `/ads-demo` to see all ad formats in action

## 🎯 Ad Formats

### Banner Ads
- **Location**: Between posts in feed (every 3 posts)
- **Dismissible**: Yes
- **Auto-show**: Yes
- **Component**: `PiBannerAd`

```tsx
import PiBannerAd from '@/components/PiBannerAd';
<PiBannerAd className="my-4" />
```

### Interstitial Ads
- **Location**: Full-screen modal
- **Frequency**: Every 2 minutes (auto)
- **Dismissible**: Yes (close button)
- **Component**: `PiInterstitialAd`

```tsx
import PiInterstitialAd from '@/components/PiInterstitialAd';
<PiInterstitialAd isOpen={show} onClose={() => setShow(false)} />
```

### Rewarded Ads
- **Location**: Modal overlay
- **User-initiated**: Always opt-in
- **Reward**: User watches for benefit
- **Component**: `PiRewardedAd`

```tsx
import PiRewardedAd from '@/components/PiRewardedAd';
<PiRewardedAd 
  isOpen={show}
  onClose={() => setShow(false)}
  onReward={handleReward}
  rewardLabel="10 Pi"
/>
```

## 🪝 Hook

### usePiAdNetwork()

```typescript
const {
  isSupported,        // boolean
  isLoading,          // boolean
  showInterstitial,   // () => Promise<boolean>
  showRewarded,       // (onReward?) => Promise<void>
  preloadInterstitial,// () => Promise<void>
  preloadRewarded,    // () => Promise<void>
  interstitialReady,  // boolean
  rewardedReady,      // boolean
} = usePiAdNetwork();
```

## 🔧 Implementation Examples

### Show Interstitial Ad
```typescript
const { showInterstitial } = usePiAdNetwork();

const handleShowAd = async () => {
  const shown = await showInterstitial();
  if (shown) console.log('Ad closed');
};
```

### Show Rewarded Ad
```typescript
const { showRewarded } = usePiAdNetwork();

const handleReward = async () => {
  console.log('User earned reward!');
};

<button onClick={() => showRewarded(handleReward)}>
  Watch Ad & Earn
</button>
```

### Preload Ads
```typescript
const { preloadInterstitial, preloadRewarded } = usePiAdNetwork();

useEffect(() => {
  preloadInterstitial();
  preloadRewarded();
}, []);
```

## 📁 Files

| File | Purpose |
|------|---------|
| `src/components/PiBannerAd.tsx` | Banner ad component |
| `src/components/PiInterstitialAd.tsx` | Interstitial ad component |
| `src/components/PiRewardedAd.tsx` | Rewarded ad component |
| `src/hooks/use-pi-adnetwork.ts` | Ad management hook |
| `src/integrations/pi/adnetwork.ts` | Pi SDK integration |
| `src/pages/AdsDemo.tsx` | Ad showcase page |
| `PI_AD_NETWORK.md` | Full documentation |

## 🚀 Quick Start

1. **Check Support**
   ```typescript
   const { isSupported } = usePiAdNetwork();
   ```

2. **Add Ads to Your Page**
   ```tsx
   import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
   
   const MyPage = () => {
     const { showInterstitial } = usePiAdNetwork();
     
     return (
       <div>
         <button onClick={() => showInterstitial()}>
           View Ad
         </button>
       </div>
     );
   };
   ```

3. **Test It**
   - Visit `/ads-demo`
   - Click "Show Ad Example" buttons
   - Test different ad types

## 📊 Current Integration

### Home Feed (`/`)
✅ Banner ads between posts  
✅ Interstitial ads every 2 minutes

### Ad Demo Page (`/ads-demo`)
✅ All ad formats visible  
✅ Interactive examples  
✅ Implementation details

## ⚙️ Configuration

### Supported In
- ✅ Pi Browser (mainnet)
- ✅ Pi Browser (sandbox)
- ❌ Regular browsers (gracefully degrades)

### Ad Frequency
- **Banner**: Every 3 posts
- **Interstitial**: Every 2 minutes (120,000ms)
- **Rewarded**: User-triggered

### Preloading
Auto-preloading enabled for:
- Interstitial ads
- Rewarded ads

## 🎯 Best Practices

1. **Check Support First**
   ```typescript
   if (!isSupported) return null;
   ```

2. **Preload Ads**
   ```typescript
   useEffect(() => {
     preloadInterstitial();
   }, []);
   ```

3. **Verify Rewards**
   ```typescript
   const isValid = await verifyRewardedAdOnBackend(adId);
   ```

4. **Show Non-Intrusive Ads**
   - Use natural break points
   - Avoid back-to-back ads
   - Always allow dismissal

## 🔗 Integration Points

**Feed** (`src/pages/Index.tsx`)
```tsx
{index % 3 === 0 && <PiBannerAd />}
<PiInterstitialAd isOpen={showAd} onClose={...} />
```

**Other Pages**
- Can be integrated into any page
- Use `usePiAdNetwork()` hook
- Check `isSupported` before displaying

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Ads not showing | Check if in Pi Browser |
| SDK not initialized | Ensure `initPiSdk()` called |
| isSupported = false | Not in Pi Browser |
| Ad network errors | Check console logs |

## 📚 Documentation

- **Full Guide**: `PI_AD_NETWORK.md`
- **Source**: Check component files
- **Examples**: Visit `/ads-demo`

---

**Status**: ✅ Ready for Use  
**Last Updated**: January 15, 2026
