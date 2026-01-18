/**
 * Pi Network Payment Helper
 * Handles all payment operations with proper backend integration
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface PaymentApprovalResponse {
  success: boolean;
  payment?: any;
  error?: string;
}

export interface PaymentCompletionResponse {
  success: boolean;
  payment?: any;
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: 'completed' | 'approved' | 'pending';
  verified: boolean;
  payment?: any;
  error?: string;
}

/**
 * Call backend edge function to approve payment
 * This must be called when onReadyForServerApproval is triggered
 */
export async function approvePaymentWithBackend(
  paymentId: string,
  userId: string,
  amount: number,
  memo: string,
  metadata?: Record<string, any>
): Promise<PaymentApprovalResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log('[Payment Helper] Approving payment:', { paymentId, userId, amount });

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        action: 'approve',
        paymentId,
        userId,
        amount,
        memo,
        metadata
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Payment Helper] Approval failed:', data);
      return {
        success: false,
        error: data.error || 'Payment approval failed'
      };
    }

    console.log('[Payment Helper] ✅ Payment approved:', data);
    return {
      success: true,
      payment: data.payment
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment approval error';
    console.error('[Payment Helper] Error:', message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Call backend edge function to complete payment
 * This must be called when onReadyForServerCompletion is triggered with txid
 */
export async function completePaymentWithBackend(
  paymentId: string,
  txid: string,
  userId?: string
): Promise<PaymentCompletionResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log('[Payment Helper] Completing payment:', { paymentId, txid });

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        action: 'complete',
        paymentId,
        txid,
        userId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Payment Helper] Completion failed:', data);
      return {
        success: false,
        error: data.error || 'Payment completion failed'
      };
    }

    console.log('[Payment Helper] ✅ Payment completed:', data);
    return {
      success: true,
      payment: data.payment
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment completion error';
    console.error('[Payment Helper] Error:', message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Verify payment status from Pi API
 * Call this to check if payment was successfully completed
 */
export async function verifyPaymentWithBackend(
  paymentId: string
): Promise<PaymentVerificationResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log('[Payment Helper] Verifying payment:', paymentId);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        action: 'verify',
        paymentId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Payment Helper] Verification failed:', data);
      return {
        success: false,
        status: 'pending',
        verified: false,
        error: data.error || 'Payment verification failed'
      };
    }

    console.log('[Payment Helper] ✅ Payment verified:', data);
    return {
      success: true,
      status: data.status,
      verified: data.verified,
      payment: data.payment
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification error';
    console.error('[Payment Helper] Error:', message);
    return {
      success: false,
      status: 'pending',
      verified: false,
      error: message
    };
  }
}

/**
 * Cancel a payment
 */
export async function cancelPaymentWithBackend(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log('[Payment Helper] Cancelling payment:', paymentId);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        action: 'cancel',
        paymentId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Payment Helper] Cancellation failed:', data);
      return {
        success: false,
        error: data.error || 'Payment cancellation failed'
      };
    }

    console.log('[Payment Helper] ✅ Payment cancelled');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment cancellation error';
    console.error('[Payment Helper] Error:', message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Get incomplete payments for recovery
 */
export async function getIncompletePayments(): Promise<{
  success: boolean;
  payments?: any[];
  error?: string;
}> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log('[Payment Helper] Fetching incomplete payments');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        action: 'incomplete'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Payment Helper] Failed to fetch incomplete payments:', data);
      return {
        success: false,
        error: data.error || 'Failed to fetch incomplete payments'
      };
    }

    console.log('[Payment Helper] ✅ Incomplete payments fetched:', data);
    return {
      success: true,
      payments: data.payments
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching incomplete payments';
    console.error('[Payment Helper] Error:', message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Complete payment flow helper
 * Handles the entire payment lifecycle
 */
export async function handleCompletePaymentFlow(
  paymentData: {
    amount: number;
    memo: string;
    metadata?: Record<string, any>;
  },
  onApprovalSuccess?: () => void,
  onCompletionSuccess?: () => void,
  onError?: (error: string) => void
): Promise<{
  createPaymentCallbacks: any;
}> {
  // Create Pi payment callbacks
  const createPaymentCallbacks = {
    onReadyForServerApproval: async (paymentId: string) => {
      console.log('[Payment Flow] Ready for server approval:', paymentId);
      
      try {
        const result = await approvePaymentWithBackend(
          paymentId,
          localStorage.getItem('pi_user_id') || 'unknown',
          paymentData.amount,
          paymentData.memo,
          paymentData.metadata
        );

        if (!result.success) {
          throw new Error(result.error || 'Approval failed');
        }

        console.log('[Payment Flow] ✅ Approval successful');
        onApprovalSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Approval error';
        console.error('[Payment Flow] Approval error:', message);
        onError?.(message);
      }
    },

    onReadyForServerCompletion: async (paymentId: string, txid: string) => {
      console.log('[Payment Flow] Ready for server completion:', { paymentId, txid });
      
      try {
        const result = await completePaymentWithBackend(
          paymentId,
          txid,
          localStorage.getItem('pi_user_id') || 'unknown'
        );

        if (!result.success) {
          throw new Error(result.error || 'Completion failed');
        }

        console.log('[Payment Flow] ✅ Completion successful');
        onCompletionSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Completion error';
        console.error('[Payment Flow] Completion error:', message);
        onError?.(message);
      }
    },

    onCancel: (paymentId: string) => {
      console.log('[Payment Flow] Payment cancelled by user:', paymentId);
      cancelPaymentWithBackend(paymentId);
    },

    onError: (error: any, payment?: any) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Payment Flow] Payment error:', message);
      onError?.(message);
    }
  };

  return { createPaymentCallbacks };
}
