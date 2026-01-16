// Pi Payments Module
// Handles payment creation and verification with Pi Network API
// Reference: https://pi-apps.github.io/community-developer-guide/docs/piPayment/

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

// Get Supabase URL for edge function calls
const getSupabaseUrl = () => {
  return import.meta.env.VITE_SUPABASE_URL || "https://zgbzubmazzxjylgdpdqi.supabase.co";
};

// Get anon key for authorization
const getAnonKey = () => {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
         import.meta.env.VITE_SUPABASE_ANON_KEY || 
         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYnp1Ym1henp4anlsZ2RwZHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzE2MjgsImV4cCI6MjA4NDA0NzYyOH0.nIHEgvgtcXVv-dJydrkW_B3GcnTZfMaUJM3ZHUiVMEI";
};

/**
 * Create a payment with Pi Network SDK
 * This initiates the payment flow in the Pi Browser
 */
export function createPayment(paymentData: PaymentData, callbacks: PaymentCallbacks): void {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK not initialized. Please open this app in Pi Browser.");
    }

    console.log("[Pi Payment] Creating payment:", paymentData);

    window.Pi.createPayment(paymentData, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log("[Pi Payment] Ready for server approval:", paymentId);
        if (callbacks.onReadyForServerApproval) {
          callbacks.onReadyForServerApproval(paymentId);
        }
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("[Pi Payment] Ready for server completion:", paymentId, txid);
        if (callbacks.onReadyForServerCompletion) {
          callbacks.onReadyForServerCompletion(paymentId, txid);
        }
      },
      onCancel: (paymentId: string) => {
        console.log("[Pi Payment] Payment cancelled:", paymentId);
        if (callbacks.onCancel) {
          callbacks.onCancel(paymentId);
        }
      },
      onError: (error: Error, payment?: any) => {
        console.error("[Pi Payment] Payment error:", error, payment);
        if (callbacks.onError) {
          callbacks.onError(error, payment);
        }
      },
    });
  } catch (error) {
    console.error("[Pi Payment] Error creating payment:", error);
    if (callbacks.onError) {
      callbacks.onError(error instanceof Error ? error : new Error("Payment creation failed"));
    }
  }
}

/**
 * Approve payment on backend (server-to-server call to Pi API)
 * Called when onReadyForServerApproval fires
 */
export async function approvePaymentOnBackend(paymentId: string, userId?: string, amount?: number, metadata?: Record<string, any>): Promise<boolean> {
  try {
    console.log("[Pi Payment] Approving payment on backend:", paymentId);
    
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAnonKey()}`,
        "apikey": getAnonKey(),
      },
      body: JSON.stringify({ 
        action: "approve", 
        paymentId,
        userId,
        amount,
        metadata,
      }),
    });

    const responseText = await response.text();
    console.log("[Pi Payment] Approve response:", response.status, responseText);

    if (!response.ok) {
      console.error("[Pi Payment] Payment approval failed:", response.status, responseText);
      return false;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { success: response.ok };
    }
    
    return data.success === true;
  } catch (error) {
    console.error("[Pi Payment] Error approving payment:", error);
    return false;
  }
}

/**
 * Complete payment on backend (server-to-server call to Pi API)
 * Called when onReadyForServerCompletion fires with txid
 */
export async function completePaymentOnBackend(paymentId: string, txid: string): Promise<boolean> {
  try {
    console.log("[Pi Payment] Completing payment on backend:", paymentId, "txid:", txid);
    
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAnonKey()}`,
        "apikey": getAnonKey(),
      },
      body: JSON.stringify({ action: "complete", paymentId, txid }),
    });

    const responseText = await response.text();
    console.log("[Pi Payment] Complete response:", response.status, responseText);

    if (!response.ok) {
      console.error("[Pi Payment] Payment completion failed:", response.status, responseText);
      return false;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { success: response.ok };
    }
    
    return data.success === true;
  } catch (error) {
    console.error("[Pi Payment] Error completing payment:", error);
    return false;
  }
}

/**
 * Verify payment status on backend
 */
export async function verifyPaymentOnBackend(paymentId: string): Promise<boolean> {
  try {
    console.log("[Pi Payment] Verifying payment:", paymentId);
    
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAnonKey()}`,
        "apikey": getAnonKey(),
      },
      body: JSON.stringify({ action: "verify", paymentId }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Pi Payment] Payment verification failed:", error);
      return false;
    }

    const data = await response.json();
    return data.status === "completed" || data.verified === true;
  } catch (error) {
    console.error("[Pi Payment] Error verifying payment:", error);
    return false;
  }
}

/**
 * Cancel payment on backend
 */
export async function cancelPaymentOnBackend(paymentId: string): Promise<boolean> {
  try {
    console.log("[Pi Payment] Cancelling payment:", paymentId);
    
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/pi-payment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAnonKey()}`,
        "apikey": getAnonKey(),
      },
      body: JSON.stringify({ action: "cancel", paymentId }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Pi Payment] Payment cancellation failed:", error);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[Pi Payment] Error cancelling payment:", error);
    return false;
  }
}

/**
 * Helper to create a simple payment with full backend integration
 * Handles the complete payment flow including approval and completion
 */
export function createSimplePayment(
  amount: number,
  memo: string,
  metadata: Record<string, any> = {},
  onSuccess?: (paymentId: string) => void,
  onError?: (error: Error) => void
): void {
  createPayment(
    { amount, memo, metadata },
    {
      onReadyForServerApproval: async (paymentId) => {
        console.log("[Pi Payment] Payment ready for approval:", paymentId);
        const approved = await approvePaymentOnBackend(paymentId, metadata.userId, amount, metadata);
        if (!approved) {
          console.error("[Pi Payment] Failed to approve payment on backend");
          if (onError) onError(new Error("Payment approval failed on server"));
        } else {
          console.log("[Pi Payment] Payment approved successfully");
        }
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        console.log("[Pi Payment] Payment ready for completion:", paymentId, "txid:", txid);
        const completed = await completePaymentOnBackend(paymentId, txid);
        if (completed) {
          console.log("[Pi Payment] Payment completed successfully");
          if (onSuccess) onSuccess(paymentId);
        } else {
          console.error("[Pi Payment] Failed to complete payment on backend");
          if (onError) onError(new Error("Payment completion failed on server"));
        }
      },
      onCancel: (paymentId) => {
        console.log("[Pi Payment] Payment cancelled by user:", paymentId);
        cancelPaymentOnBackend(paymentId);
        if (onError) onError(new Error("Payment cancelled by user"));
      },
      onError: (error) => {
        console.error("[Pi Payment] Payment error:", error);
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
