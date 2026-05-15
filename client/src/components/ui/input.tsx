import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Input({ className, iconLeft, iconRight, ...p }: Props) {
  return (
    <div className="relative w-full">
      {iconLeft && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex text-muted-foreground [&_svg]:size-4">
          {iconLeft}
        </span>
      )}
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
          iconLeft ? "pl-9" : undefined,
          iconRight ? "pr-9" : undefined,
          className
        )}
        {...p}
      />
      {iconRight && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex text-muted-foreground [&_svg]:size-4">
          {iconRight}
        </span>
      )}
    </div>
  );
}
