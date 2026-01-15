import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePiAdNetwork } from "@/hooks/use-pi-adnetwork";
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Loader2 } from "lucide-react";

interface PiAdComponentProps {
  type?: "interstitial" | "rewarded";
  onReward?: () => Promise<void> | void;
  label?: string;
  className?: string;
}

export function PiAdComponent({
  type = "interstitial",
  onReward,
  label,
  className,
}: PiAdComponentProps) {
  const { isSupported, isLoading, showInterstitial, showRewarded } =
    usePiAdNetwork();
  const [isShowing, setIsShowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShowAd = async () => {
    try {
      setError(null);
      setIsShowing(true);

      if (type === "interstitial") {
        await showInterstitial();
      } else {
        await showRewarded(onReward);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show ad");
    } finally {
      setIsShowing(false);
    }
  };

  if (!isSupported && !isLoading) {
    return null; // Don't show if ads not supported
  }

  if (isLoading) {
    return (
      <Button disabled variant="outline" className={className}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading ads...
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleShowAd}
        disabled={isShowing}
        variant={type === "rewarded" ? "default" : "outline"}
        className={className}
      >
        {isShowing ? (
          <>
            <LoadingLogo size="sm" className="mr-2" />
            Showing Ad...
          </>
        ) : (
          label || (type === "rewarded" ? "Watch Ad for Reward" : "Watch Ad")
        )}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
