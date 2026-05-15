"use client";
import { ReactNode, createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

type Mode = "single" | "multiple";
type Ctx = {
  mode: Mode;
  open: string[];
  toggle: (v: string) => void;
};
const AccordionCtx = createContext<Ctx | null>(null);

function useAcc() {
  const ctx = useContext(AccordionCtx);
  if (!ctx) throw new Error("Accordion parts must be inside <Accordion>");
  return ctx;
}

type AccordionProps = {
  mode?: Mode;
  defaultValue?: string | string[];
  className?: string;
  children: ReactNode;
};

export function Accordion({ mode = "single", defaultValue, className, children }: AccordionProps) {
  const initial = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
  const [open, setOpen] = useState<string[]>(initial);

  const toggle = (v: string) => {
    setOpen((prev) => {
      const isOpen = prev.includes(v);
      if (mode === "single") return isOpen ? [] : [v];
      return isOpen ? prev.filter((x) => x !== v) : [...prev, v];
    });
  };

  return (
    <AccordionCtx.Provider value={{ mode, open, toggle }}>
      <div className={cn("flex flex-col divide-y divide-border rounded-md border border-border", className)}>
        {children}
      </div>
    </AccordionCtx.Provider>
  );
}

type ItemCtxType = { value: string; isOpen: boolean };
const ItemCtx = createContext<ItemCtxType | null>(null);
function useItem() {
  const ctx = useContext(ItemCtx);
  if (!ctx) throw new Error("AccordionTrigger/Content must be inside AccordionItem");
  return ctx;
}

export function AccordionItem({ value, children }: { value: string; children: ReactNode }) {
  const { open } = useAcc();
  const isOpen = open.includes(value);
  return <ItemCtx.Provider value={{ value, isOpen }}><div>{children}</div></ItemCtx.Provider>;
}

export function AccordionTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { toggle } = useAcc();
  const { value, isOpen } = useItem();
  return (
    <button
      type="button"
      onClick={() => toggle(value)}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-accent",
        className
      )}
    >
      {children}
      <ChevronDown
        className="h-4 w-4 transition-transform"
        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
      />
    </button>
  );
}

export function AccordionContent({ children, className }: { children: ReactNode; className?: string }) {
  const { isOpen } = useItem();
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={cn("px-4 pb-3 text-sm text-muted-foreground", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
