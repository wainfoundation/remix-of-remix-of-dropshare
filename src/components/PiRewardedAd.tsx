import { useEffect, useState } from 'react';
import { Gift, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { LoadingLogo } from '@/components/ui/loading-logo';

interface PiRewardedAdProps {
  isOpen: boolean;
  onClose: () => void;
  onReward?: () => void;
  rewardLabel?: string;
}

/**
 * Pi Ad Network Rewarded Ad Component
 * Users watch an ad to earn rewards
 * 
 * Official Implementation:
 * - Uses Pi.Ads.showAd("rewarded")
 * - Backend must verify adId before granting reward
 * - See: https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md
 */
export function PiRewardedAd({
  isOpen,
  onClose,
  onReward,
  rewardLabel = "Reward",
}: PiRewardedAdProps) {
  const { showRewarded } = usePiAdNetwork();
  const [isWatching, setIsWatching] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWatchAd = async () => {
    setIsWatching(true);
    setError(null);

    try {
      // Show rewarded ad following official SDK flow
      const result = await showRewarded(() => {
        // This callback is called AFTER ad is shown
        // Backend should verify adId before granting reward
        setIsRewarded(true);
        if (onReward) {
          onReward();
        }
      });

      if (!result.rewarded) {
        setError("Failed to complete the ad. Please try again.");
        setIsWatching(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show ad");
      setIsWatching(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={isWatching}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isRewarded ? (
            <>
              {/* Success State */}
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Creator Monetization Coming Soon</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Creator rewards feature will launch soon. Thank you for supporting DropShare!
                </p>
              </div>

              <Button onClick={onClose} className="w-full">
                Continue
              </Button>
            </>
          ) : (
            <>
              {/* Monetization Coming Soon State */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Creator Monetization</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Creator rewards are launching soon. Watch this space!
                </p>
              </div>

              {/* Ad Preview */}
              <div className="w-full h-[200px] bg-gradient-to-br from-muted to-muted/50 rounded-lg border border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Pi Network Ad</p>
                  <p className="text-xs text-muted-foreground">30-60 second video</p>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                  {error}
                </p>
              )}

              <Button
                onClick={handleWatchAd}
                disabled={isWatching}
                className="w-full"
                size="lg"
              >
                {isWatching ? (
                  <>
                    <LoadingLogo size="sm" className="mr-2" />
                    Loading Ad...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Watch Ad
                  </>
                )}
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
                disabled={isWatching}
              >
                Maybe Later
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/50 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Ads support creators and keep DropShare free
          </p>
        </div>
      </div>
    </div>
  );
}

export default PiRewardedAd;
