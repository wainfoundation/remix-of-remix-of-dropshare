import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "strong" | "subtle";
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, variant = "default", type, ...props }, ref) => {
    const variantClasses = {
      default: "glass",
      strong: "glass-strong",
      subtle: "glass-subtle",
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all",
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassInput };
