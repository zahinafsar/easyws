"use client";
import {
  ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useId,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Portal } from "./portal";
import { cn } from "../../lib/cn";
import { useEscapeKey, useControllable } from "../../lib/hooks";
import { useAnchorPosition, type Side, type Align } from "../../lib/anchor";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};
const MenuCtx = createContext<Ctx | null>(null);

function useMenuCtx() {
  const ctx = useContext(MenuCtx);
  if (!ctx) throw new Error("DropdownMenu parts must be inside <DropdownMenu>");
  return ctx;
}

type LevelCtxT = {
  registerSub: (id: string, close: () => void) => () => void;
  closeOthers: (id: string) => void;
  closeAll: () => void;
};
const LevelCtx = createContext<LevelCtxT | null>(null);

function useLevel() {
  return useContext(LevelCtx);
}

function useLevelState() {
  const subs = useRef<Map<string, () => void>>(new Map());
  const value = useMemo<LevelCtxT>(
    () => ({
      registerSub: (id, close) => {
        subs.current.set(id, close);
        return () => {
          subs.current.delete(id);
        };
      },
      closeOthers: (id) => {
        subs.current.forEach((close, key) => {
          if (key !== id) close();
        });
      },
      closeAll: () => {
        subs.current.forEach((close) => close());
      },
    }),
    []
  );
  return value;
}

type SubCtxT = {
  id: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  side: Side;
  focusSelf: () => void;
};
const SubCtx = createContext<SubCtxT | null>(null);

function useSubCtx() {
  const ctx = useContext(SubCtx);
  if (!ctx) throw new Error("DropdownMenuSub parts must be inside <DropdownMenuSub>");
  return ctx;
}

function isInsideAnyMenu(target: Node) {
  const menus = document.querySelectorAll<HTMLElement>('[data-dropdown-menu="true"]');
  for (const m of menus) if (m.contains(target)) return true;
  return false;
}

type Props = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: ReactNode;
};

export function DropdownMenu({ open, defaultOpen = false, onOpenChange, children }: Props) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const anchorRef = useRef<HTMLButtonElement>(null);
  return <MenuCtx.Provider value={{ open: isOpen, setOpen, anchorRef }}>{children}</MenuCtx.Provider>;
}

export function DropdownMenuTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { setOpen, open, anchorRef } = useMenuCtx();
  return (
    <button
      ref={anchorRef}
      type="button"
      aria-haspopup="menu"
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

export function DropdownMenuContent({ children, className, side = "bottom", align = "start" }: ContentProps) {
  const { open, setOpen, anchorRef } = useMenuCtx();
  const contentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pos = useAnchorPosition(anchorRef, contentRef, open, side, align);
  const level = useLevelState();

  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (isInsideAnyMenu(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, anchorRef, setOpen]);

  const openRef = useRef(open);
  useEffect(() => {
    if (open && !openRef.current) setActive(0);
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const items = contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
      if (!items || !items.length) return;
      const n = items.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % n);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + n) % n);
      } else if (e.key === "Enter") {
        e.preventDefault();
        items[active]?.click();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const items = contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    items?.forEach((el, i) => {
      el.dataset.active = i === active ? "true" : "false";
    });
  }, [active, open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            role="menu"
            data-dropdown-menu="true"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            onMouseLeave={level.closeAll}
            style={{ position: "absolute", top: pos.top, left: pos.left }}
            className={cn("z-50 min-w-48 rounded-md border border-border bg-card p-1 shadow-md", className)}
          >
            <LevelCtx.Provider value={level}>{children}</LevelCtx.Provider>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

type ItemProps = {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
};

export function DropdownMenuItem({ children, onSelect, disabled, className }: ItemProps) {
  const { setOpen } = useMenuCtx();
  const level = useLevel();
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled}
      onMouseEnter={() => level?.closeAll()}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-border", className)} />;
}

type SubProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  side?: Side;
  children: ReactNode;
};

export function DropdownMenuSub({
  open,
  defaultOpen = false,
  onOpenChange,
  side = "right",
  children,
}: SubProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const anchorRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const level = useLevel();

  function focusSelf() {
    level?.closeOthers(id);
  }

  useEffect(() => {
    if (!level) return;
    return level.registerSub(id, () => setOpen(false));
  }, [level, id, setOpen]);

  return (
    <SubCtx.Provider value={{ id, open: isOpen, setOpen, anchorRef, side, focusSelf }}>
      {children}
    </SubCtx.Provider>
  );
}

export function DropdownMenuSubTrigger({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { setOpen, open, anchorRef, focusSelf } = useSubCtx();
  return (
    <div
      ref={anchorRef}
      role="menuitem"
      tabIndex={-1}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-disabled={disabled}
      onMouseEnter={() => {
        if (disabled) return;
        focusSelf();
        setOpen(true);
      }}
      onClick={() => !disabled && setOpen(!open)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          focusSelf();
          setOpen(true);
        }
      }}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      data-state={open ? "open" : "closed"}
    >
      <span className="flex items-center">{children}</span>
      <ChevronRight className="h-4 w-4 opacity-60" />
    </div>
  );
}

const bridgePad: Record<Side, string> = {
  right: "pl-2",
  left: "pr-2",
  top: "pb-2",
  bottom: "pt-2",
};

export function DropdownMenuSubContent({
  children,
  className,
  align = "start",
}: Omit<ContentProps, "side">) {
  const { open, setOpen, anchorRef, side } = useSubCtx();
  const contentRef = useRef<HTMLDivElement>(null);
  const pos = useAnchorPosition(anchorRef, contentRef, open, side, align, 0);
  const level = useLevelState();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            data-dropdown-menu="true"
            initial={{ opacity: 0, scale: 0.95, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -4 }}
            transition={{ duration: 0.12 }}
            onMouseLeave={() => setOpen(false)}
            style={{ position: "absolute", top: pos.top, left: pos.left }}
            className={cn("z-50", bridgePad[side])}
          >
            <div
              role="menu"
              className={cn("min-w-44 rounded-md border border-border bg-card p-1 shadow-md", className)}
            >
              <LevelCtx.Provider value={level}>{children}</LevelCtx.Provider>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
