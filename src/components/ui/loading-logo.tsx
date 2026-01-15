import { AppLogo } from "@/components/AppLogo";
import { cn } from "@/lib/utils";

interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingLogo({ size = 'md', className }: LoadingLogoProps) {
  return (
    <AppLogo 
      size={size} 
      className={cn("animate-spin", className)} 
    />
  );
}