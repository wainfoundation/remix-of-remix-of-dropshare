# Pi Ad Network Implementation - Architecture & Flow

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        DropShare App                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Pages:                     Hooks:              Components:   │
│  ├─ Index.tsx             ├─ usePiAdNetwork   ├─ PiBannerAd │
│  │ (Feed)                 │  (Official SDK)   ├─ PiInterstitial
│  │                        │  - Support check  └─ PiRewardedAd
│  └─ AdsDemo.tsx           │  - Error handling │
│     (Showcase)            │  - Preloading     │
│                           │                   │
│                           └─ Manages all SDK │
│                              calls via       │
│                              Window.Pi.Ads   │
│                                              │
└─────────────────────────────────────────────────────────────┘
              ↓
         Pi Browser SDK
         (Pi.Ads.*)
              ↓
         Pi Ad Network
         (Official)
```

---

## 🔄 Ad Flow Diagrams

### Interstitial Ad (Advanced Flow)

```
User browsing feed
        ↓
[Every 2 minutes OR natural break point]
        ↓
┌─ Check if ad is ready
│  Pi.Ads.isAdReady("interstitial")
│         ↓
│    [Not Ready?]
│         ↓
│  Pi.Ads.requestAd("interstitial")
│         ↓
│    [Request success?]
│    YES → Ready
│    NO  → Show error message
│
│  [Ready]
│         ↓
└─ Show the ad
   Pi.Ads.showAd("interstitial")
        ↓
   [Wait for user to close]
        ↓
   result === "AD_CLOSED"
        ↓
   Preload next ad
        ↓
   Resume user activity
```

### Rewarded Ad (Advanced Flow with Backend Verification)

```
User clicks "Watch Ad & Earn"
        ↓
┌─ Check if ad is ready
│  Pi.Ads.isAdReady("rewarded")
│         ↓
│    [Not Ready?]
│         ↓
│  Pi.Ads.requestAd("rewarded")
│         ↓
│  [Request success?]
│    NO  → Show error modal
│
│  [Ready]
│         ↓
└─ Show the ad
   Pi.Ads.showAd("rewarded")
        ↓
   [User watches entire ad]
        ↓
   result === "AD_REWARDED"
        ↓
   Backend Verification ⚠️ (CRITICAL)
   POST /api/pi-ads/verify
   with adId
        ↓
   ┌─ Check response
   │  {
   │    mediator_ack_status: "granted" | "denied"
   │  }
   │
   └─ Only reward if
      mediator_ack_status === "granted"
        ↓
   Show reward granted modal
        ↓
   Preload next ad
        ↓
   Update user balance
```

---

## 📊 Feed Integration Strategy

```
Post 1 [Index 0]
  ↓
Post 2 [Index 1]
  ↓
Post 3 [Index 2]
  ↓
Post 4 [Index 3]
  ↓
[BANNER AD] ← Every 3 posts (Index % 3 === 0)
  ↓
Post 5 [Index 4]
  ↓
Post 6 [Index 5]
  ↓
Post 7 [Index 6]
  ↓
Post 8 [Index 7]
  ↓
[BANNER AD] ← Every 3 posts
  ↓
...

PLUS: [INTERSTITIAL AD] ← Every 2 minutes automatically
(Modal overlay at natural breaks)
```

---

## 🔐 Security Flow for Rewarded Ads

```
Frontend              Backend              Pi Platform API
─────────────────────────────────────────────────────────────

User watches ad
        ↓
showAd("rewarded")
        ↓
Returns {
  result: "AD_REWARDED",
  adId: "abc123..."  ← Unique ad ID
}
        ↓
Send adId to backend ────→ POST /api/pi-ads/verify
                          with { adId }
                              ↓
                          Call Pi Platform API
                          POST api.pi.delivery/2/me/ads/{adId}
                          with Authorization header
                              ↓
                          Returns {
                            mediator_ack_status: "granted"
                          }
                              ↓
                          Check status
                          if === "granted" →
                          Grant reward ✅
                          
                          if !== "granted" →
                          Deny reward ❌
                          Log incident
                          
        ←────────────── Return { rewarded: true/false }
        ↓
Update user balance
& show notification
```

---

## 🎯 Component States

### PiBannerAd Component

```
Initial State:
┌─────────────────────────────────────┐
│   🎯 Sponsored Content Ad           │
│   "Support creators on DropShare"   │ [X Hide]
└─────────────────────────────────────┘
        ↓
User clicks [X Hide]
        ↓
Component hidden
(useState handles visibility)
```

### PiInterstitialAd Component

```
Hidden State (default)
        ↓
[Trigger condition met]
        ↓
Modal Overlay:
┌──────────────────────────────────┐
│        [X] Close Button          │
├──────────────────────────────────┤
│                                  │
│   🎯 Pi Network Ad               │
│   [500px ad space]               │
│                                  │
│    [Continue Button]             │
│                                  │
├──────────────────────────────────┤
│ Sponsored                        │
└──────────────────────────────────┘
        ↓
User clicks [Continue] or [X]
        ↓
Modal closes
User activity resumes
```

### PiRewardedAd Component

```
Initial State (Hidden)
        ↓
[User clicks "Watch Ad"]
        ↓
Modal Opens:
┌──────────────────────────────────┐
│   🎁 Earn a Reward               │
│                                  │
│   Watch a short ad to earn       │
│   [10 Pi coins]                  │
│                                  │
│   [User watches 30-60 sec ad]    │
│                                  │
│    [Watch Ad & Earn]             │
│    [Maybe Later]                 │
└──────────────────────────────────┘
        ↓
[Ad completes]
        ↓
Success State:
┌──────────────────────────────────┐
│   ✅ Reward Earned!              │
│                                  │
│   You've earned [10 Pi]          │
│   Thank you for supporting       │
│   creators!                      │
│                                  │
│    [Continue]                    │
└──────────────────────────────────┘
        ↓
[Backend verifies adId]
        ↓
[Reward granted in database]
        ↓
[User balance updated]
```

---

## 📦 Hook Return Object

```typescript
{
  // Support Detection
  isSupported: boolean,      // ✅ ad_network in nativeFeaturesList
  isLoading: boolean,        // Loading state for initial check
  
  // Ad Readiness Status
  interstitialReady: boolean,
  rewardedReady: boolean,
  
  // Core Methods
  
  // Show Interstitial - Advanced flow
  showInterstitial: () => Promise<boolean>
  
  // Show Rewarded - Returns adId for backend verification
  showRewarded: (onReward?: () => void) => 
    Promise<{ rewarded: boolean; adId?: string }>
  
  // Utility Methods
  isAdReady: (type: "interstitial" | "rewarded") 
    => Promise<boolean>
    
  requestAd: (type: "interstitial" | "rewarded") 
    => Promise<boolean>
}
```

---

## 🔄 Error Handling Response Types

```
Pi.Ads.showAd() Responses:

Interstitial:
├─ "AD_CLOSED"        ✅ Success - ad watched
├─ "AD_CANCELED"      ⚠️  User closed early
├─ "ADS_NOT_SUPPORTED" ❌ Outdated Pi Browser
└─ Other errors       ❌ Fallback to error state

Rewarded:
├─ "AD_REWARDED"       ✅ Success - eligible for reward
├─ "AD_CANCELED"       ⚠️  User closed early
├─ "ADS_NOT_SUPPORTED" ❌ Outdated Pi Browser
└─ Other errors        ❌ Fallback to error state

requestAd() Responses:
├─ "AD_LOADED"        ✅ Success
├─ "AD_FAILED"        ❌ Temporary failure
├─ "ADS_NOT_SUPPORTED" ❌ Not available
└─ Other              ❌ Fallback
```

---

## 🎯 Best Practice Placements

```
✅ GOOD - Natural Break Points:
  ├─ After scrolling 10+ posts
  ├─ Between page navigations
  ├─ After completing an action
  └─ At timed intervals (2+ min)

❌ BAD - Avoid:
  ├─ During critical interaction
  ├─ Back-to-back ads
  ├─ During text input
  ├─ In the middle of content
  └─ On every single action
```

---

## 📈 Implementation Checklist

```
Core Implementation:
  [✅] usePiAdNetwork hook updated
  [✅] Support detection working
  [✅] Advanced error flows implemented
  [✅] Type safety with TypeScript
  [✅] Components updated
  
Integration:
  [✅] Feed integration (banners & interstitials)
  [✅] AdsDemo page created
  [✅] Routes configured
  [✅] Error handling complete
  
Security:
  [✅] Backend verification ready
  [✅] API Key configured
  [✅] Type-safe responses
  
Testing:
  [✅] No compilation errors
  [✅] Graceful degradation in non-Pi browsers
  [✅] Ready for Pi Browser testing
  
Documentation:
  [✅] Official guide created
  [✅] Quick reference created
  [✅] Implementation status documented
  [✅] Architecture documented (this file)
```

---

**Ready for Testing**: Open DropShare in Pi Browser and visit `/ads-demo` to see all ad formats!
