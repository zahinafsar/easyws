"use client";
import { ReactNode, useRef, useState, cloneElement, isValidElement, ReactElement } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Portal } from "./portal";
import { cn } from "../../lib/cn";
import { useAnchorPosition, type Side } from "../../lib/anchor";

type Props = {
  content: ReactNode;
  children: ReactElement<React.HTMLAttributes<HTMLElement>>;
  side?: Side;
  delay?: number;
  className?: string;
};

export function Tooltip({ content, children, side = "top", delay = 300, className }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pos = useAnchorPosition(anchorRef, contentRef, open, side, "center", 6);

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }

  if (!isValidElement(children)) return children;

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement) => {
      anchorRef.current = node;
    },
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  } as React.HTMLAttributes<HTMLElement> & { ref: (n: HTMLElement) => void });

  return (
    <>
      {trigger}
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={contentRef}
              role="tooltip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              style={{ position: "absolute", top: pos.top, left: pos.left }}
              className={cn(
                "z-50 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground shadow-md pointer-events-none",
                className
              )}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
