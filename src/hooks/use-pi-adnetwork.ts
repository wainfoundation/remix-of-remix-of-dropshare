// React Hook for Pi AdNetwork - Official Implementation
// Based on: https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md
import { useEffect, useState, useCallback } from "react";

type AdType = "interstitial" | "rewarded";

interface ShowAdResponse {
  result: string;
  adId?: string;
}

interface IsAdReadyResponse {
  ready: boolean;
}

interface RequestAdResponse {
  result: string;
}

interface UsePiAdNetworkReturn {
  isSupported: boolean;
  isLoading: boolean;
  interstitialReady: boolean;
  rewardedReady: boolean;
  showInterstitial: () => Promise<boolean>;
  showRewarded: (onReward?: () => void) => Promise<{ rewarded: boolean; adId?: string }>;
  isAdReady: (type: AdType) => Promise<boolean>;
  requestAd: (type: AdType) => Promise<boolean>;
}

/**
 * Hook for managing Pi Ad Network
 * Official implementation following Pi Platform Docs
 * https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md
 *
 * Supports:
 * - Interstitial Ads (full-screen at natural breaks)
 * - Rewarded Ads (full-screen for user rewards)
 * - Advanced flow with error handling
 */
export function usePiAdNetwork(): UsePiAdNetworkReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [interstitialReady, setInterstitialReady] = useState(false);
  const [rewardedReady, setRewardedReady] = useState(false);

  // Check if AdNetwork is supported on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (!window.Pi) {
          setIsSupported(false);
          setIsLoading(false);
          return;
        }

        // Check if ad_network is in native features list
        // This indicates Pi Browser supports ads
        const nativeFeaturesList = await window.Pi.nativeFeaturesList();
        const supported = nativeFeaturesList.includes("ad_network");
        setIsSupported(supported);

        if (supported) {
          // Check if ads are ready on init
          const intReady = await checkAdReadyInternal("interstitial");
          const rewReady = await checkAdReadyInternal("rewarded");
          setInterstitialReady(intReady);
          setRewardedReady(rewReady);
        }
      } catch (error) {
        console.error("Error checking ad network support:", error);
        setIsSupported(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSupport();
  }, []);

  // Internal: Check if ad is ready
  const checkAdReadyInternal = useCallback(
    async (type: AdType): Promise<boolean> => {
      try {
        if (!window.Pi?.Ads?.isAdReady) {
          return false;
        }
        const response: IsAdReadyResponse = await window.Pi.Ads.isAdReady(type);
        return response.ready === true;
      } catch (error) {
        console.error(`Error checking if ${type} ad is ready:`, error);
        return false;
      }
    },
    []
  );

  // Helper: Request an ad
  const doRequestAd = useCallback(async (type: AdType): Promise<boolean> => {
    try {
      if (!window.Pi?.Ads?.requestAd) {
        return false;
      }
      const response: RequestAdResponse = await window.Pi.Ads.requestAd(type);

      if (response.result === "ADS_NOT_SUPPORTED") {
        console.warn(
          `Ads not supported: User may have outdated Pi Browser. Recommend updating.`
        );
        return false;
      }

      return response.result === "AD_LOADED";
    } catch (error) {
      console.error(`Error requesting ${type} ad:`, error);
      return false;
    }
  }, []);

  /**
   * Advanced Interstitial Ad Flow
   * 1. Check if ad is ready
   * 2. Request if not ready
   * 3. Show the ad
   * 4. Preload next ad
   *
   * Best for: Level transitions, section changes, natural breaks
   */
  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Ad network not supported on this device");
      return false;
    }

    try {
      // 1. Check if ad is ready
      const ready = await checkAdReadyInternal("interstitial");

      if (!ready) {
        // 2. Request ad if not ready
        const loaded = await doRequestAd("interstitial");
        if (!loaded) {
          console.warn("Failed to load interstitial ad");
          return false;
        }
      }

      // 3. Show the ad
      const response: ShowAdResponse = await window.Pi.Ads.showAd(
        "interstitial"
      );

      if (response.result === "AD_CLOSED") {
        // Update ready status and preload next
        setInterstitialReady(false);
        doRequestAd("interstitial");
        return true;
      }

      if (response.result === "AD_CANCELED") {
        console.info("User closed interstitial ad");
        return false;
      }

      if (response.result === "ADS_NOT_SUPPORTED") {
        console.warn(
          "Ad network not supported on this Pi Browser version. Recommend update."
        );
        return false;
      }

      return false;
    } catch (error) {
      console.error("Error showing interstitial ad:", error);
      return false;
    }
  }, [isSupported, checkAdReadyInternal, doRequestAd]);

  /**
   * Advanced Rewarded Ad Flow
   * 1. Check if ad is ready
   * 2. Request if not ready
   * 3. Show the ad
   * 4. Call onReward if successful (MUST verify on backend!)
   * 5. Preload next ad
   *
   * IMPORTANT: Always verify adId with Pi Platform API before rewarding:
   * POST https://api.pi.delivery/2/me/ads/{adId}
   * Check: mediator_ack_status === "granted"
   *
   * Best for: Extra lives, premium features, bonus resources
   */
  const showRewarded = useCallback(
    async (onReward?: () => void): Promise<{ rewarded: boolean; adId?: string }> => {
      if (!isSupported) {
        console.warn("Ad network not supported on this device");
        return { rewarded: false };
      }

      try {
        // 1. Check if ad is ready
        const ready = await checkAdReadyInternal("rewarded");

        if (!ready) {
          // 2. Request ad if not ready
          const loaded = await doRequestAd("rewarded");
          if (!loaded) {
            console.warn("Failed to load rewarded ad");
            return { rewarded: false };
          }
        }

        // 3. Show the ad
        const response: ShowAdResponse = await window.Pi.Ads.showAd("rewarded");

        if (response.result === "AD_REWARDED") {
          // ⚠️ IMPORTANT: onReward must verify adId on backend!
          // See official docs for verification:
          // https://github.com/pi-apps/pi-platform-docs/blob/master/platform_API.md#verify-a-rewarded-ad-status
          if (onReward) {
            onReward();
          }

          // Update ready status and preload next
          setRewardedReady(false);
          doRequestAd("rewarded");

          return {
            rewarded: true,
            adId: response.adId,
          };
        }

        if (response.result === "AD_CANCELED") {
          console.info("User closed rewarded ad without completing");
          return { rewarded: false };
        }

        if (response.result === "ADS_NOT_SUPPORTED") {
          console.warn(
            "Ads not supported: User may have outdated Pi Browser. Recommend update."
          );
          return { rewarded: false };
        }

        return { rewarded: false };
      } catch (error) {
        console.error("Error showing rewarded ad:", error);
        return { rewarded: false };
      }
    },
    [isSupported, checkAdReadyInternal, doRequestAd]
  );

  /**
   * Check if a specific ad type is ready
   */
  const isAdReady = useCallback(
    async (type: AdType): Promise<boolean> => {
      return checkAdReadyInternal(type);
    },
    [checkAdReadyInternal]
  );

  /**
   * Manually request an ad
   * Useful if automatic loading failed
   */
  const requestAd = useCallback(
    async (type: AdType): Promise<boolean> => {
      return doRequestAd(type);
    },
    [doRequestAd]
  );

  return {
    isSupported,
    isLoading,
    interstitialReady,
    rewardedReady,
    showInterstitial,
    showRewarded,
    isAdReady,
    requestAd,
  };
}

