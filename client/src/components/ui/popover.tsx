"use client";
import { ReactNode, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Portal } from "./portal";
import { cn } from "../../lib/cn";
import { useControllable, useClickOutside, useEscapeKey } from "../../lib/hooks";
import { useAnchorPosition, type Side, type Align } from "../../lib/anchor";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};
const PopoverCtx = createContext<Ctx | null>(null);

function usePopoverCtx() {
  const ctx = useContext(PopoverCtx);
  if (!ctx) throw new Error("Popover parts must be inside <Popover>");
  return ctx;
}

type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: ReactNode;
};

export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const anchorRef = useRef<HTMLButtonElement>(null);
  return (
    <PopoverCtx.Provider value={{ open: isOpen, setOpen, anchorRef }}>{children}</PopoverCtx.Provider>
  );
}

export function PopoverTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { setOpen, open, anchorRef } = usePopoverCtx();
  return (
    <button
      ref={anchorRef}
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  );
}

type ContentProps = {
  children: ReactNode;
  className?: string;
  side?: Side;
  align?: Align;
};

export function PopoverContent({ children, className, side = "bottom", align = "center" }: ContentProps) {
  const { open, setOpen, anchorRef } = usePopoverCtx();
  const contentRef = useRef<HTMLDivElement>(null);
  const pos = useAnchorPosition(anchorRef, contentRef, open, side, align);

  useClickOutside(contentRef, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ position: "absolute", top: pos.top, left: pos.left }}
            className={cn(
              "z-50 w-72 rounded-md border border-border bg-card p-4 shadow-md",
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
