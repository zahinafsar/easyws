import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

export function Breadcrumb({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      {children}
    </nav>
  );
}

export function BreadcrumbItem({ children, current }: { children: ReactNode; current?: boolean }) {
  return (
    <span className={cn(current && "font-medium text-foreground")} aria-current={current ? "page" : undefined}>
      {children}
    </span>
  );
}

export function BreadcrumbSeparator() {
  return <ChevronRight className="h-4 w-4 opacity-50" />;
}
