"use client";
import { useState, ImgHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ src, alt = "", fallback, size = "md", className, ...p }: Props) {
  const [errored, setErrored] = useState(false);
  const showImg = src && !errored;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
        sizes[size],
        className
      )}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
          {...p}
        />
      ) : (
        <span>{fallback?.slice(0, 2).toUpperCase() ?? "?"}</span>
      )}
    </span>
  );
}
