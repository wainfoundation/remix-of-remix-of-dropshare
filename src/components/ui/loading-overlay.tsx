import { cn } from "@/lib/utils";
import { LoadingLogo } from "./loading-logo";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  transparent?: boolean;
}

const LoadingOverlay = ({ 
  isLoading, 
  text = "Loading...", 
  className,
  transparent = false 
}: LoadingOverlayProps) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      transparent ? "bg-background/80" : "bg-background",
      "backdrop-blur-sm transition-opacity duration-200",
      className
    )}>
      <div className="flex flex-col items-center justify-center p-8">
        {/* DropShare Logo Spinning */}
        <div className="mb-6">
          <LoadingLogo size="xl" />
        </div>
        
        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            DropShare
          </h2>
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        </div>
        
        {/* Progress indicator dots */}
        <div className="flex space-x-1 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;