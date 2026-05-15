"use client";
import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/cn";
import { Portal } from "./portal";

type Ctx = { collapsed: boolean; toggle: () => void };
const SidebarCtx = createContext<Ctx | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar outside <Sidebar>");
  return ctx;
}

type SidebarProps = {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
  className?: string;
  children: ReactNode;
};

export function Sidebar({ collapsed, defaultCollapsed = false, onCollapsedChange, className, children }: SidebarProps) {
  const [internal, setInternal] = useState(defaultCollapsed);
  const isControlled = collapsed !== undefined;
  const value = isControlled ? collapsed : internal;
  const toggle = () => {
    const next = !value;
    if (!isControlled) setInternal(next);
    onCollapsedChange?.(next);
  };
  return (
    <SidebarCtx.Provider value={{ collapsed: value, toggle }}>
      <motion.aside
        initial={false}
        animate={{ width: value ? 64 : 256 }}
        transition={{ type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn("flex h-full flex-col overflow-hidden border-r border-border bg-card", className)}
      >
        {children}
      </motion.aside>
    </SidebarCtx.Provider>
  );
}

export function SidebarHeader({ children, className }: { children: ReactNode; className?: string }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex shrink-0 border-b border-border px-4",
        collapsed ? "flex-col-reverse items-center gap-2 py-3" : "h-14 items-center",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-1 flex-col gap-1 overflow-y-auto p-3", className)}>{children}</div>;
}

export function SidebarFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-border p-3", className)}>{children}</div>;
}

type ItemProps = {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function SidebarItem({ icon, label, active, onClick, className }: ItemProps) {
  const { collapsed } = useSidebar();
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-primary before:transition-opacity",
        active
          ? "bg-accent text-accent-foreground font-medium before:opacity-100"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground before:opacity-0",
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

type GroupProps = {
  icon?: ReactNode;
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function SidebarGroup({ icon, label, defaultOpen = false, children, className }: GroupProps) {
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(defaultOpen);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expanded = open && !collapsed;

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setFlyoutOpen(false), 120);
  };
  const openFlyout = () => {
    if (!collapsed) return;
    cancelClose();
    const el = triggerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.right + 8 });
    }
    setFlyoutOpen(true);
  };

  useEffect(() => {
    if (!collapsed) setFlyoutOpen(false);
  }, [collapsed]);
  useEffect(() => () => cancelClose(), []);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={openFlyout}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (collapsed ? (flyoutOpen ? setFlyoutOpen(false) : openFlyout()) : setOpen((o) => !o))}
        onFocus={openFlyout}
        onBlur={scheduleClose}
        title={collapsed ? label : undefined}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 items-center justify-between truncate"
            >
              <span className="truncate">{label}</span>
              <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronRight className="h-4 w-4" />
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-6 flex flex-col gap-1 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {collapsed && flyoutOpen && rect && (
          <Portal>
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ position: "fixed", top: rect.top, left: rect.left }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="z-50 min-w-48 rounded-md border border-border bg-card p-1 shadow-md"
            >
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{label}</div>
              <SidebarCtx.Provider value={{ collapsed: false, toggle: () => {} }}>
                <div className="flex flex-col gap-1">{children}</div>
              </SidebarCtx.Provider>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { collapsed, toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
        <ChevronRight className="h-4 w-4" />
      </motion.span>
    </button>
  );
}
