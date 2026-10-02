import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "paid" | "unpaid" | "pending" | "failed" | "success";
  dot?: boolean;
}

function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "border-transparent bg-blue-600 text-white shadow-xs",
    secondary: "border-transparent bg-slate-100 text-slate-900",
    destructive: "border-transparent bg-rose-50 text-rose-700 border border-rose-200",
    outline: "text-slate-700 border border-slate-200 bg-white",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
    unpaid: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",
    pending: "bg-amber-50 text-amber-700 border border-amber-200 font-semibold",
    failed: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
  };

  const dotColors = {
    default: "bg-white",
    secondary: "bg-slate-400",
    destructive: "bg-rose-500",
    outline: "bg-slate-400",
    paid: "bg-emerald-500",
    unpaid: "bg-slate-400",
    pending: "bg-amber-500",
    failed: "bg-rose-500",
    success: "bg-emerald-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {(dot || variant === "paid" || variant === "unpaid" || variant === "pending" || variant === "failed") && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColors[variant] || "bg-emerald-500"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge };
