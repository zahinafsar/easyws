"use client";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Children,
  isValidElement,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search } from "lucide-react";
import { Portal } from "./portal";
import { cn } from "../../lib/cn";
import { useControllable, useEscapeKey } from "../../lib/hooks";

type Ctx = {
  query: string;
  active: number;
  setActive: (i: number) => void;
  registerIndex: (value: string, onSelect?: () => void) => number;
  close: () => void;
};
const CmdCtx = createContext<Ctx | null>(null);

function useCmd() {
  const ctx = useContext(CmdCtx);
  if (!ctx) throw new Error("Command parts must be inside <CommandPalette>");
  return ctx;
}

type Props = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  placeholder?: string;
  children: ReactNode;
  hotkey?: boolean;
  emptyMessage?: string;
};

function matches(label: string, query: string) {
  if (!query) return true;
  return label.toLowerCase().includes(query.toLowerCase());
}

function collectItems(children: ReactNode, query: string): string[] {
  const out: string[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as React.ReactElement<{ value?: string; children?: ReactNode }>;
    if (el.props.value !== undefined) {
      if (matches(el.props.value, query)) out.push(el.props.value);
    } else if (el.props.children) {
      out.push(...collectItems(el.props.children, query));
    }
  });
  return out;
}

export function CommandPalette({
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder = "Type a command or search...",
  children,
  hotkey = true,
  emptyMessage = "No results found.",
}: Props) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  useEscapeKey(() => setOpen(false), isOpen);

  useEffect(() => {
    if (!hotkey) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey, isOpen, setOpen]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <PaletteInner
            placeholder={placeholder}
            emptyMessage={emptyMessage}
            close={() => setOpen(false)}
          >
            {children}
          </PaletteInner>
        )}
      </AnimatePresence>
    </Portal>
  );
}

type InnerProps = {
  placeholder: string;
  emptyMessage: string;
  close: () => void;
  children: ReactNode;
};

function PaletteInner({ placeholder, emptyMessage, close, children }: InnerProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const handlersRef = useRef<Map<string, () => void>>(new Map());

  const visibleValues = useMemo(() => collectItems(children, query), [children, query]);

  function onQueryChange(v: string) {
    setQuery(v);
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(visibleValues.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + visibleValues.length) % Math.max(visibleValues.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const val = visibleValues[active];
      if (val) handlersRef.current.get(val)?.();
    }
  }

  const registerIndex = (value: string, onSelect?: () => void) => {
    if (onSelect) handlersRef.current.set(value, onSelect);
    return visibleValues.indexOf(value);
  };

  const ctxValue: Ctx = { query, active, setActive, registerIndex, close };

  return (
    <CmdCtx.Provider value={ctxValue}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={close}
        className="fixed inset-0 z-50 bg-black/60"
      />
      <div className="pointer-events-none fixed inset-x-0 top-[20%] z-50 flex justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 opacity-50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {visibleValues.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              children
            )}
          </div>
        </motion.div>
      </div>
    </CmdCtx.Provider>
  );
}

type GroupProps = { heading?: string; children: ReactNode };

export function CommandGroup({ heading, children }: GroupProps) {
  const { query } = useCmd();
  const hasMatch = collectItems(children, query).length > 0;
  if (!hasMatch) return null;
  return (
    <div className="flex flex-col">
      {heading && (
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{heading}</div>
      )}
      {children}
    </div>
  );
}

type ItemProps = {
  value: string;
  onSelect?: () => void;
  children: ReactNode;
  className?: string;
};

export function CommandItem({ value, onSelect, children, className }: ItemProps) {
  const { query, active, registerIndex, setActive, close } = useCmd();
  if (!matches(value, query)) return null;

  const index = registerIndex(value, () => {
    onSelect?.();
    close();
  });
  const isActive = index === active;

  return (
    <div
      role="option"
      aria-selected={isActive}
      onMouseEnter={() => setActive(index)}
      onClick={() => {
        onSelect?.();
        close();
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm text-foreground",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
