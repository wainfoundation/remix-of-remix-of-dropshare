// Pi Payments Module
// Handles payment creation and verification

export interface PaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

export interface PaymentCallbacks {
  onReadyForServerApproval?: (paymentId: string) => void;
  onReadyForServerCompletion?: (paymentId: string, txid: string) => void;
  onCancel?: (paymentId: string) => void;
  onError?: (error: Error, payment?: any) => void;
}

const getSupabaseUrl = () => import.meta.env.VITE_SUPABASE_URL;

/**
 * Create a payment with Pi Network
 */
export function createPayment(paymentData: PaymentData, callbacks: PaymentCallbacks): void {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK not initialized. Please open this app in Pi Browser.");
    }

    window.Pi.createPayment(paymentData, {
      onReadyForServerApproval: callbacks.onReadyForServerApproval,
      onReadyForServerCompletion: callbacks.onReadyForServerCompletion,
      onCancel: callbacks.onCancel,
      onError: callbacks.onError,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    if (callbacks.onError) {
      callbacks.onError(error instanceof Error ? error : new Error("Payment creation failed"));
    }
  }
}

/**
 * Approve payment on backend
 */
export async function approvePaymentOnBackend(paymentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", paymentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Payment approval failed:", error);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error approving payment:", error);
    return false;
  }
}

/**
 * Complete payment on backend
 */
export async function completePaymentOnBackend(paymentId: string, txid: string): Promise<boolean> {
  try {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", paymentId, txid }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Payment completion failed:", error);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error completing payment:", error);
    return false;
  }
}

/**
 * Verify payment on backend
 */
export async function verifyPaymentOnBackend(paymentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", paymentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Payment verification failed:", error);
      return false;
    }

    const data = await response.json();
    return data.status === "verified";
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}

/**
 * Cancel payment on backend
 */
export async function cancelPaymentOnBackend(paymentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", paymentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Payment cancellation failed:", error);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error cancelling payment:", error);
    return false;
  }
}

/**
 * Helper to create a simple payment with full backend integration
 */
export function createSimplePayment(
  amount: number,
  memo: string,
  metadata: Record<string, any> = {},
  onSuccess?: (paymentId: string) => void,
  onError?: (error: Error) => void
): void {
  createPayment(
    {
      amount,
      memo,
      metadata,
    },
    {
      onReadyForServerApproval: async (paymentId) => {
        console.log("Payment ready for approval:", paymentId);
        const approved = await approvePaymentOnBackend(paymentId);
        if (!approved) {
          console.error("Failed to approve payment on backend");
          if (onError) onError(new Error("Payment approval failed"));
        }
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        console.log("Payment ready for completion:", paymentId, txid);
        const completed = await completePaymentOnBackend(paymentId, txid);
        if (completed) {
          console.log("Payment completed successfully");
          if (onSuccess) onSuccess(paymentId);
        } else {
          console.error("Failed to complete payment on backend");
          if (onError) onError(new Error("Payment completion failed"));
        }
      },
      onCancel: (paymentId) => {
        console.log("Payment cancelled:", paymentId);
        // Optionally cancel on backend
        cancelPaymentOnBackend(paymentId);
      },
      onError: (error) => {
        console.error("Payment error:", error);
        if (onError) onError(error);
      },
    }
  );
}

// Extend Window interface for Pi SDK
declare global {
  interface Window {
    Pi?: any;
  }
}
