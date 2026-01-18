import { useCallback, useEffect, useState } from 'react';
import {
  approvePaymentWithBackend,
  completePaymentWithBackend,
  verifyPaymentWithBackend,
  cancelPaymentWithBackend,
  getIncompletePayments,
  handleCompletePaymentFlow
} from '../lib/pi-payment-helper';

// Pi Types
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

interface UsePiIntegrationReturn {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: PiAuthResult['user'] | null;
  authenticate: (scopes?: string[]) => Promise<PiAuthResult | null>;
  createPayment: (paymentData: PiPaymentData, callbacks: PiPaymentCallbacks) => Promise<any>;
  approvePayment: (paymentId: string, amount: number, memo: string) => Promise<any>;
  completePayment: (paymentId: string, txid: string) => Promise<any>;
  verifyPayment: (paymentId: string) => Promise<any>;
  cancelPayment: (paymentId: string) => Promise<any>;
  getIncompletePayments: () => Promise<any>;
  handlePaymentFlow: (paymentData: PiPaymentData, callbacks?: {
    onApprovalSuccess?: () => void;
    onCompletionSuccess?: () => void;
    onError?: (error: string) => void;
  }) => Promise<any>;
  showAd: (adType: 'interstitial' | 'rewarded') => Promise<any>;
  isAdReady: (adType: 'interstitial' | 'rewarded') => Promise<{ ready: boolean }>;
  requestAd: (adType: 'interstitial' | 'rewarded') => Promise<any>;
  nativeFeaturesList: () => Promise<string[]>;
  error: string | null;
}

/**
 * Hook for managing Pi Network integration
 * Provides authentication, payments, and ads functionality
 */
export const usePiIntegration = (): UsePiIntegrationReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<PiAuthResult['user'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Pi SDK on mount
  useEffect(() => {
    const initPi = async () => {
      try {
        if (typeof window === 'undefined' || !window.Pi) {
          setError('Pi SDK not available - ensure you are using Pi Browser');
          return;
        }

        // Initialize Pi SDK with production settings
        await window.Pi.init({ version: '2.0', sandbox: false });
        setIsInitialized(true);
        console.log('✅ Pi SDK initialized successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize Pi SDK';
        setError(message);
        console.error('Pi SDK initialization error:', err);
      }
    };

    initPi();
  }, []);

  // Pi Authentication
  const authenticate = useCallback(
    async (scopes: string[] = ['payments']): Promise<PiAuthResult | null> => {
      try {
        if (!isInitialized) {
          setError('Pi SDK not initialized');
          return null;
        }

        if (!window.Pi) {
          setError('Pi SDK not available');
          return null;
        }

        setError(null);

        const onIncompletePaymentFound = (payment: any) => {
          console.log('Incomplete payment found:', payment);
          // Handle incomplete payment recovery
        };

        const authResult: PiAuthResult = await window.Pi.authenticate(
          scopes,
          onIncompletePaymentFound
        );

        setUser(authResult.user);
        setIsAuthenticated(true);
        
        console.log('✅ Pi authentication successful');
        console.log('User ID:', authResult.user.uid);
        console.log('Username:', authResult.user.username);

        // Store auth info for backend verification
        localStorage.setItem('pi_auth_token', authResult.accessToken);
        localStorage.setItem('pi_user_id', authResult.user.uid);
        if (authResult.user.username) {
          localStorage.setItem('pi_username', authResult.user.username);
        }

        return authResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setError(message);
        console.error('Pi authentication error:', err);
        return null;
      }
    },
    [isInitialized]
  );

  // Pi Payments
  const createPayment = useCallback(
    async (
      paymentData: PiPaymentData,
      callbacks: PiPaymentCallbacks
    ): Promise<any> => {
      try {
        if (!isInitialized) {
          setError('Pi SDK not initialized');
          return null;
        }

        if (!window.Pi) {
          setError('Pi SDK not available');
          return null;
        }

        setError(null);

        console.log('Creating payment:', paymentData);

        const payment = await window.Pi.createPayment(paymentData, callbacks);
        console.log('✅ Payment created:', payment);
        return payment;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment creation failed';
        setError(message);
        console.error('Pi payment error:', err);
        throw err;
      }
    },
    [isInitialized]
  );

  // Show Ad (Interstitial or Rewarded)
  const showAd = useCallback(
    async (adType: 'interstitial' | 'rewarded'): Promise<any> => {
      try {
        if (!isInitialized) {
          setError('Pi SDK not initialized');
          return null;
        }

        if (!window.Pi?.Ads) {
          setError('Pi Ads not available');
          return null;
        }

        setError(null);

        console.log(`Showing ${adType} ad`);
        const response = await window.Pi.Ads.showAd(adType);
        console.log(`✅ ${adType} ad displayed:`, response);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to show ${adType} ad`;
        setError(message);
        console.error(`Pi ${adType} ad error:`, err);
        throw err;
      }
    },
    [isInitialized]
  );

  // Check if ad is ready
  const isAdReady = useCallback(
    async (adType: 'interstitial' | 'rewarded'): Promise<{ ready: boolean }> => {
      try {
        if (!isInitialized) {
          setError('Pi SDK not initialized');
          return { ready: false };
        }

        if (!window.Pi?.Ads) {
          setError('Pi Ads not available');
          return { ready: false };
        }

        setError(null);

        const response = await window.Pi.Ads.isAdReady(adType);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check ad status';
        setError(message);
        console.error('Pi ad ready check error:', err);
        return { ready: false };
      }
    },
    [isInitialized]
  );

  // Request ad manually
  const requestAd = useCallback(
    async (adType: 'interstitial' | 'rewarded'): Promise<any> => {
      try {
        if (!isInitialized) {
          setError('Pi SDK not initialized');
          return null;
        }

        if (!window.Pi?.Ads) {
          setError('Pi Ads not available');
          return null;
        }

        setError(null);

        console.log(`Requesting ${adType} ad`);
        const response = await window.Pi.Ads.requestAd(adType);
        console.log(`✅ ${adType} ad requested:`, response);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to request ${adType} ad`;
        setError(message);
        console.error(`Pi request ${adType} ad error:`, err);
        throw err;
      }
    },
    [isInitialized]
  );

  // Get native features list
  const nativeFeaturesList = useCallback(async (): Promise<string[]> => {
    try {
      if (!isInitialized) {
        setError('Pi SDK not initialized');
        return [];
      }

      if (!window.Pi) {
        setError('Pi SDK not available');
        return [];
      }

      setError(null);

      const features = await window.Pi.nativeFeaturesList?.();
      console.log('Native features available:', features);
      return features || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get native features';
      setError(message);
      console.error('Pi native features error:', err);
      return [];
    }
  }, [isInitialized]);

  // Payment helper methods
  const approvePayment = useCallback(
    async (paymentId: string, amount: number, memo: string) => {
      const userId = localStorage.getItem('pi_user_id') || 'unknown';
      const result = await approvePaymentWithBackend(paymentId, userId, amount, memo);
      if (!result.success) {
        setError(result.error || 'Payment approval failed');
      }
      return result;
    },
    []
  );

  const completePayment = useCallback(
    async (paymentId: string, txid: string) => {
      const userId = localStorage.getItem('pi_user_id') || 'unknown';
      const result = await completePaymentWithBackend(paymentId, txid, userId);
      if (!result.success) {
        setError(result.error || 'Payment completion failed');
      }
      return result;
    },
    []
  );

  const verifyPayment = useCallback(
    async (paymentId: string) => {
      const result = await verifyPaymentWithBackend(paymentId);
      if (!result.success) {
        setError(result.error || 'Payment verification failed');
      }
      return result;
    },
    []
  );

  const cancelPaymentCallback = useCallback(
    async (paymentId: string) => {
      const result = await cancelPaymentWithBackend(paymentId);
      if (!result.success) {
        setError(result.error || 'Payment cancellation failed');
      }
      return result;
    },
    []
  );

  const getIncompletePaymentsCallback = useCallback(async () => {
    const result = await getIncompletePayments();
    if (!result.success) {
      setError(result.error || 'Failed to fetch incomplete payments');
    }
    return result;
  }, []);

  const handlePaymentFlow = useCallback(
    async (
      paymentData: PiPaymentData,
      callbacks?: {
        onApprovalSuccess?: () => void;
        onCompletionSuccess?: () => void;
        onError?: (error: string) => void;
      }
    ) => {
      const { createPaymentCallbacks } = await handleCompletePaymentFlow(
        paymentData,
        callbacks?.onApprovalSuccess,
        callbacks?.onCompletionSuccess,
        callbacks?.onError
      );

      return createPayment(paymentData, createPaymentCallbacks);
    },
    [createPayment]
  );

  return {
    isInitialized,
    isAuthenticated,
    user,
    authenticate,
    createPayment,
    approvePayment,
    completePayment,
    verifyPayment,
    cancelPayment: cancelPaymentCallback,
    getIncompletePayments: getIncompletePaymentsCallback,
    handlePaymentFlow,
    showAd,
    isAdReady,
    requestAd,
    nativeFeaturesList,
    error
  };
};
