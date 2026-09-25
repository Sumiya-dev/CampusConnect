import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B00] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none";

    const variantStyles = {
      default:
        "bg-[#FF6B00] text-black font-semibold hover:bg-[#E05E00]",
      destructive:
        "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
      outline:
        "border border-[#222222] bg-[#0A0A0A] text-[#EDEDED] hover:bg-[#141414] hover:border-[#333333]",
      secondary:
        "bg-[#141414] text-[#EDEDED] hover:bg-[#1E1E1E] border border-[#222222]",
      ghost:
        "text-[#9AA1AA] hover:text-[#EDEDED] hover:bg-[#141414]",
      link: "text-[#FF6B00] hover:underline underline-offset-4 p-0 h-auto",
    };

    const sizeStyles = {
      default: "h-10 px-3.5 py-2",
      sm: "h-7 rounded px-2.5 text-sm",
      lg: "h-10 rounded-md px-5 text-base",
      icon: "h-9 w-8",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-3.5 w-3.5 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
