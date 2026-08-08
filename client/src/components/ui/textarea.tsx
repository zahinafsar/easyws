import { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...p }: Props) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...p}
    />
  );
}
