import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePiPayment } from "@/hooks/use-pi-payment";
import { LoadingLogo } from '@/components/ui/loading-logo';
import { initPiSdk, isPiSdkInitialized } from "@/integrations/pi/init";
import { useToast } from "@/hooks/use-toast";

interface PiPaymentButtonProps {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function PiPaymentButton({
  amount,
  memo,
  metadata = {},
  onSuccess,
  onError,
  label,
  className,
  disabled = false,
}: PiPaymentButtonProps) {
  const { isProcessing, error, createPayment } = usePiPayment();
  const [localError, setLocalError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const { toast } = useToast();

  // Initialize Pi SDK on mount
  useEffect(() => {
    const initSdk = async () => {
      try {
        if (isPiSdkInitialized()) {
          setSdkReady(true);
          return;
        }

        await initPiSdk({ version: "2.0", sandbox: true });
        setSdkReady(true);
      } catch (err) {
        console.error("Failed to initialize Pi SDK:", err);
        setLocalError("Please open this app in Pi Browser");
      }
    };

    initSdk();
  }, []);

  const handlePayment = async () => {
    try {
      setLocalError(null);
      await createPayment(amount, memo, metadata);
      toast({
        title: "Payment Successful",
        description: `You've paid ${amount} Pi`,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setLocalError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  };

  const isDisabled = disabled || isProcessing || !sdkReady || !!localError;

  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <Button
        onClick={handlePayment}
        disabled={isDisabled}
        className="bg-[#6C63FF] hover:bg-[#5651D8] gap-2"
      >
        {!sdkReady ? (
          <>
            <LoadingLogo size="sm" />
            Initializing...
          </>
        ) : isProcessing ? (
          <>
            <LoadingLogo size="sm" />
            Processing...
          </>
        ) : (
          <>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2V9h2v8z"/>
            </svg>
            {label || `Pay ${amount} π`}
          </>
        )}
      </Button>
      {(error || localError) && (
        <p className="text-xs text-destructive text-center">
          {error?.message || localError}
        </p>
      )}
    </div>
  );
}
