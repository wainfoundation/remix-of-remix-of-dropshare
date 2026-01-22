import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle";
  withGradientBorder?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", withGradientBorder = false, ...props }, ref) => {
    const variantClasses = {
      default: "glass-card",
      strong: "glass-card-strong",
      subtle: "glass-card-subtle",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          withGradientBorder && "glass-gradient-border",
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
