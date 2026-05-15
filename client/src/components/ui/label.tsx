import { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

const positions = {
  top: "flex-col gap-2",
  bottom: "flex-col-reverse gap-2",
  left: "flex-row items-center gap-3",
  right: "flex-row-reverse items-center gap-3",
};

interface LabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "content"> {
  content?: ReactNode;
  children?: ReactNode;
  position?: keyof typeof positions;
}

export function Label({
  className,
  content,
  children,
  position = "top",
  ...p
}: LabelProps) {
  return (
    <label className={cn("flex", positions[position], className)} {...p}>
      {content !== undefined && (
        <span className="text-sm font-medium leading-none">{content}</span>
      )}
      {children}
    </label>
  );
}
