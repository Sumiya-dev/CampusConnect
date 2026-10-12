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
    default: <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />,
  };

  const variantStyles = {
    default: "bg-surface border-border text-foreground",
    success: "bg-surface border-emerald-500/20 text-foreground",
    warning: "bg-surface border-amber-500/20 text-foreground",
    destructive: "bg-surface border-red-500/20 text-foreground",
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
        {title && <h5 className="font-medium text-base text-foreground tracking-tight">{title}</h5>}
        <div className="text-sm text-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export { Alert };
