import { useCallback, useState } from 'react';

interface DropShareConfig {
  apiKey: string;
  validationKey: string;
}

interface DropShareTransaction {
  userId: string;
  amount: number;
  description: string;
  metadata?: Record<string, any>;
  signature?: string;
}

interface UseDropShareApiReturn {
  isVerified: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  verifyCredentials: (config: DropShareConfig) => Promise<boolean>;
  getApiStatus: () => Promise<any>;
  signPayload: (payload: string) => Promise<{ payload: string; signature: string }>;
  logTransaction: (transaction: DropShareTransaction) => Promise<any>;
  getApiInfo: () => Promise<any>;
}

/**
 * Hook for managing DropShare API integration
 * Handles API verification, signing, and transaction logging
 */
export const useDropShareApi = (): UseDropShareApiReturn => {
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropshare-api`
    : '/api/dropshare-api';

  // Verify DropShare API credentials
  const verifyCredentials = useCallback(
    async (config: DropShareConfig): Promise<boolean> => {
      setStatus('loading');
      setError(null);

      try {
        const response = await fetch(`${EDGE_FUNCTION_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-dropshare-key': config.apiKey,
            'x-validation-key': config.validationKey,
          },
          body: JSON.stringify({
            apiKey: config.apiKey,
            validationKey: config.validationKey,
          }),
        });

        if (!response.ok) {
          throw new Error(`Verification failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.verified) {
          setIsVerified(true);
          setStatus('success');
          console.log('✅ DropShare API credentials verified');
          
          // Store verified flag in localStorage
          localStorage.setItem('dropshare_verified', 'true');
          localStorage.setItem('dropshare_verify_time', new Date().toISOString());
          
          return true;
        } else {
          throw new Error(data.error || 'Verification failed');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        setStatus('error');
        setIsVerified(false);
        console.error('DropShare verification error:', err);
        return false;
      }
    },
    []
  );

  // Get API status
  const getApiStatus = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus('success');
      console.log('✅ DropShare API status:', data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get API status';
      setError(message);
      setStatus('error');
      console.error('DropShare status error:', err);
      return null;
    }
  }, []);

  // Sign payload with validation key
  const signPayload = useCallback(
    async (payload: string): Promise<{ payload: string; signature: string }> => {
      setStatus('loading');
      setError(null);

      try {
        const response = await fetch(`${EDGE_FUNCTION_URL}/sign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payload }),
        });

        if (!response.ok) {
          throw new Error(`Signing failed: ${response.statusText}`);
        }

        const data = await response.json();
        setStatus('success');
        console.log('✅ Payload signed successfully');
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign payload';
        setError(message);
        setStatus('error');
        console.error('DropShare signing error:', err);
        throw err;
      }
    },
    []
  );

  // Log transaction
  const logTransaction = useCallback(
    async (transaction: DropShareTransaction): Promise<any> => {
      setStatus('loading');
      setError(null);

      try {
        const response = await fetch(`${EDGE_FUNCTION_URL}/log-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction),
        });

        if (!response.ok) {
          throw new Error(`Transaction logging failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setStatus('success');
          console.log('✅ Transaction logged:', data);
          return data;
        } else {
          throw new Error(data.error || 'Transaction logging failed');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to log transaction';
        setError(message);
        setStatus('error');
        console.error('DropShare transaction error:', err);
        throw err;
      }
    },
    []
  );

  // Get API info
  const getApiInfo = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get API info: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus('success');
      console.log('✅ DropShare API info:', data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get API info';
      setError(message);
      setStatus('error');
      console.error('DropShare info error:', err);
      return null;
    }
  }, []);

  return {
    isVerified,
    status,
    error,
    verifyCredentials,
    getApiStatus,
    signPayload,
    logTransaction,
    getApiInfo,
  };
};
