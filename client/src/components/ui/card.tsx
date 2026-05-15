import { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-border bg-card text-card-foreground p-6 shadow-sm", className)}
      {...p}
    />
  );
}
