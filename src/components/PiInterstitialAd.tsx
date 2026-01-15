import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingLogo } from '@/components/ui/loading-logo';

interface PiInterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * Pi Ad Network Interstitial Ad Component
 * Full-screen ad shown at natural break points (navigation, page transitions)
 * Similar to Facebook/Instagram interstitial ads
 */
export function PiInterstitialAd({ isOpen, onClose, isLoading = false }: PiInterstitialAdProps) {
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
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Ad Content */}
        <div className="relative w-full h-[400px] bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center gap-4 p-6">
          {isLoading ? (
            <>
              <LoadingLogo size="lg" className="text-primary" />
              <p className="text-sm text-muted-foreground">Loading ad...</p>
            </>
          ) : (
            <>
              <div className="w-full h-[300px] bg-background/50 rounded border border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">Pi Network Ad</p>
                  <p className="text-sm text-muted-foreground">
                    Supporting creators on DropShare
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </>
          )}
        </div>

        {/* Ad Label */}
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium uppercase">Ad</p>
          <p className="text-xs text-muted-foreground">Sponsored</p>
        </div>
      </div>
    </div>
  );
}

export default PiInterstitialAd;
