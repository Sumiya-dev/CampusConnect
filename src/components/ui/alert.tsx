import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive";
  title?: string;
}

const Alert: React.FC<AlertProps> = ({
  className,
  variant = "default",
  title,
  children,
  ...props
}) => {
  const icons = {
    default: <Info className="h-4 w-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />,
  };

  const variantStyles = {
    default: "bg-[#0A0A0A] border-[#222222] text-[#EDEDED]",
    success: "bg-[#0A0A0A] border-emerald-500/20 text-[#EDEDED]",
    warning: "bg-[#0A0A0A] border-amber-500/20 text-[#EDEDED]",
    destructive: "bg-[#0A0A0A] border-red-500/20 text-[#EDEDED]",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative flex w-full gap-3 rounded-md border p-3.5 text-sm items-start",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-medium text-base text-[#EDEDED] tracking-tight">{title}</h5>}
        <div className="text-sm text-[#9AA1AA] leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export { Alert };
