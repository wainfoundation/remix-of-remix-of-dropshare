// React Hook for Pi Payments
import { useState } from "react";
import { createSimplePayment, verifyPaymentOnBackend } from "@/integrations/pi/payments";

interface UsePiPaymentReturn {
  isProcessing: boolean;
  error: Error | null;
  createPayment: (amount: number, memo: string, metadata?: Record<string, any>) => Promise<void>;
}

/**
 * Hook for managing Pi Network payments
 */
export function usePiPayment(): UsePiPaymentReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPayment = async (
    amount: number,
    memo: string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      await new Promise<void>((resolve, reject) => {
        createSimplePayment(amount, memo, metadata, () => resolve(), reject);
      });
    } catch (err) {
      const paymentError = err instanceof Error ? err : new Error("Payment failed");
      setError(paymentError);
      throw paymentError;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    createPayment,
  };
}
