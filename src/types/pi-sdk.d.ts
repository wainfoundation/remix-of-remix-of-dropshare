// Pi Network SDK Type Definitions
// This file extends the Window interface with Pi SDK types

interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username?: string;
  };
}

interface PiPaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
}

interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: any, payment?: any) => void;
}

interface PiAds {
  showAd: (adType: 'interstitial' | 'rewarded') => Promise<any>;
  isAdReady: (adType: 'interstitial' | 'rewarded') => Promise<{ ready: boolean }>;
  requestAd: (adType: 'interstitial' | 'rewarded') => Promise<any>;
}

interface PiSDK {
  init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: any) => void
  ) => Promise<PiAuthResult>;
  createPayment: (
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ) => Promise<any>;
  Ads: PiAds;
  nativeFeaturesList?: () => Promise<string[]>;
}

// Extend Window interface
declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

export {};
