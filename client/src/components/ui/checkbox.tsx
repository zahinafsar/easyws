"use client";
import { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, checked, ...p }: Props) {
  return (
    <label className={cn("relative inline-flex h-4 w-4 shrink-0 items-center justify-center", className)}>
      <input type="checkbox" checked={checked} className="peer absolute inset-0 h-4 w-4 cursor-pointer opacity-0" {...p} />
      <span className="pointer-events-none flex h-4 w-4 items-center justify-center rounded border border-input bg-background transition-colors duration-150 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50">
        <Check
          strokeWidth={3}
          className={cn(
            "h-3 w-3 text-primary-foreground transition-all duration-150 ease-out",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
          )}
        />
      </span>
    </label>
  );
}
