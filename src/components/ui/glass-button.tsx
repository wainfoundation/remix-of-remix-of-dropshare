import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "strong" | "subtle";
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "glass",
      strong: "glass-strong",
      subtle: "glass-subtle",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all",
          "hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
