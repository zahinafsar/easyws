import { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const variants = {
  primary: "bg-primary/15 border border-primary/30 text-primary",
  secondary: "bg-secondary/40 border border-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  danger: "bg-destructive/15 border border-destructive/30 text-destructive",
  success: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500",
  warning: "bg-amber-500/15 border border-amber-500/30 text-amber-500",
  info: "bg-sky-500/15 border border-sky-500/30 text-sky-500",
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ variant = "primary", className, ...p }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium [&>svg]:size-3",
        variants[variant],
        className
      )}
      {...p}
    />
  );
}
