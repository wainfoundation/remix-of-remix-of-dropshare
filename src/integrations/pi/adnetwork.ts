// Pi AdNetwork Module
// Handles displaying ads (interstitial, rewarded, and banner)

export interface IsAdReadyResponse {
  type: "interstitial" | "rewarded";
  ready: boolean;
}

export interface RequestAdResponse {
  type: "interstitial" | "rewarded";
  result: "AD_LOADED" | "AD_FAILED_TO_LOAD" | "AD_NOT_AVAILABLE" | "ADS_NOT_SUPPORTED";
}

export interface ShowAdResponse {
  type: "interstitial" | "rewarded";
  result: string;
  adId?: string;
}

const getSupabaseUrl = () => import.meta.env.VITE_SUPABASE_URL;

/**
 * Check if AdNetwork is supported on user's Pi Browser
 */
export async function isAdNetworkSupported(): Promise<boolean> {
  try {
    if (!window.Pi) {
      return false;
    }

    const nativeFeaturesList = await window.Pi.nativeFeaturesList();
    return nativeFeaturesList.includes("ad_network");
  } catch (error) {
    console.error("Error checking ad network support:", error);
    return false;
  }
}

/**
 * Check if an ad is ready to display
 */
export async function isAdReady(adType: "interstitial" | "rewarded"): Promise<boolean> {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK not initialized");
    }

    const response: IsAdReadyResponse = await window.Pi.Ads.isAdReady(adType);
    return response.ready;
  } catch (error) {
    console.error(`Error checking if ${adType} ad is ready:`, error);
    return false;
  }
}

/**
 * Request an ad to be loaded
 */
export async function requestAd(adType: "interstitial" | "rewarded"): Promise<string> {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK not initialized");
    }

    const response: RequestAdResponse = await window.Pi.Ads.requestAd(adType);
    return response.result;
  } catch (error) {
    console.error(`Error requesting ${adType} ad:`, error);
    return "AD_FAILED_TO_LOAD";
  }
}

/**
 * Display an interstitial ad
 * These are full-screen ads shown at natural break points (e.g., level transitions)
 */
export async function showInterstitialAd(): Promise<boolean> {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK not initialized");
    }

    // Check if ad is ready
    const ready = await isAdReady("interstitial");
    if (!ready) {
      const result = await requestAd("interstitial");
      if (result !== "AD_LOADED") {
        console.warn("Failed to load interstitial ad");
        return false;
      }
    }

    const response: ShowAdResponse = await window.Pi.Ads.showAd("interstitial");
    return response.result === "AD_CLOSED";
  } catch (error) {
    console.error("Error showing interstitial ad:", error);
    return false;
  }
}

/**
 * Display a rewarded ad
 * User must be authenticated to view rewarded ads
 * Returns adId for server-side verification
 */
export async function showRewardedAd(): Promise<{ rewarded: boolean; adId?: string }> {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK not initialized");
    }

    // Check if ad is ready
    const ready = await isAdReady("rewarded");
    if (!ready) {
      const result = await requestAd("rewarded");
      if (result !== "AD_LOADED") {
        console.warn("Failed to load rewarded ad");
        return { rewarded: false };
      }
    }

    const response: ShowAdResponse = await window.Pi.Ads.showAd("rewarded");

    if (response.result === "AD_REWARDED") {
      return {
        rewarded: true,
        adId: response.adId,
      };
    }

    if (response.result === "USER_UNAUTHENTICATED") {
      console.warn("User must be authenticated to watch rewarded ads");
      return { rewarded: false };
    }

    if (response.result === "ADS_NOT_SUPPORTED") {
      console.warn("Your Pi Browser version does not support ads. Please update.");
      return { rewarded: false };
    }

    return { rewarded: false };
  } catch (error) {
    console.error("Error showing rewarded ad:", error);
    return { rewarded: false };
  }
}

/**
 * Verify rewarded ad status with Pi Platform API (backend call)
 * IMPORTANT: Call this from your backend before rewarding users
 * This prevents fraud from hacked SDK versions
 */
export async function verifyRewardedAdOnBackend(adId: string): Promise<boolean> {
  try {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-ads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId }),
    });

    if (!response.ok) {
      throw new Error("Failed to verify ad");
    }

    const data = await response.json();
    return data.mediator_ack_status === "granted";
  } catch (error) {
    console.error("Error verifying rewarded ad:", error);
    return false;
  }
}

/**
 * Helper function to handle complete rewarded ad flow
 */
export async function handleRewardedAdFlow(
  onReward: () => Promise<void> | void
): Promise<boolean> {
  try {
    const result = await showRewardedAd();

    if (!result.rewarded) {
      console.log("Ad was not rewarded");
      return false;
    }

    if (result.adId) {
      // Verify with backend before rewarding
      const isValid = await verifyRewardedAdOnBackend(result.adId);
      if (!isValid) {
        console.error("Ad verification failed - user will not be rewarded");
        return false;
      }
    }

    // Grant reward to user
    await onReward();
    console.log("User rewarded successfully");
    return true;
  } catch (error) {
    console.error("Error in rewarded ad flow:", error);
    return false;
  }
}

// Extend Window interface for Pi SDK
declare global {
  interface Window {
    Pi?: any;
  }
}
