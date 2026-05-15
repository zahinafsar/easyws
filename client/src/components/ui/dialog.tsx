"use client";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Portal } from "./portal";
import { cn } from "../../lib/cn";
import { useEscapeKey, useFocusTrap } from "../../lib/hooks";

type DialogProps = {
  open: boolean;
  onOpenChange?: (v: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const close = () => onOpenChange?.(false);
  useEscapeKey(close, open);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/60"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "pointer-events-auto relative w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-lg",
                  className
                )}
              >
                {children}
                <button
                  onClick={close}
                  aria-label="Close"
                  className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}

