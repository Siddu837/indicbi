import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "gradient"
    | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20",
      outline:
        "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200/60",
      ghost:
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      link: "text-blue-600 underline-offset-4 hover:underline",
      gradient:
        "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25 hover:opacity-95 hover:shadow-lg",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-2xl px-6 text-base",
      icon: "h-10 w-10 p-0"
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
