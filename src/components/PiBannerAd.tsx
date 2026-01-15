import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { LoadingLogo } from '@/components/ui/loading-logo';

interface PiBannerAdProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Pi Ad Network Banner Ad Component
 * Displays as a native ad space in the feed, similar to Facebook/Instagram
 */
export function PiBannerAd({ className, showLabel = true }: PiBannerAdProps) {
  const { isSupported, isLoading } = usePiAdNetwork();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn(
        "w-full bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-center min-h-[200px]",
        className
      )}>
        <LoadingLogo size="md" className="text-muted-foreground" />
      </div>
    );
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn(
      "w-full bg-gradient-to-br from-muted to-muted/50 border border-border rounded-lg p-4 mb-4",
      className
    )}>
      {showLabel && (
        <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">
          Sponsored Content
        </p>
      )}

      <div className="w-full h-[200px] bg-background/50 rounded border border-dashed border-border flex flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Pi Network Ads loaded here
        </p>
        <p className="text-xs text-muted-foreground">
          Ads support creators on DropShare
        </p>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
      >
        Hide ad
      </button>
    </div>
  );
}

export default PiBannerAd;
