import { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const variants = {
  default: "bg-card text-card-foreground border-border",
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900",
  success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-900",
  warning: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900",
  danger: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-900",
};

type Props = HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants };

export function Alert({ variant = "default", className, ...p }: Props) {
  return (
    <div role="alert" className={cn("rounded-md border p-4", variants[variant], className)} {...p} />
  );
}

export function AlertTitle({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-semibold leading-none", className)} {...p} />;
}

export function AlertDescription({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm opacity-90", className)} {...p} />;
}
