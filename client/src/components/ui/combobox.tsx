"use client";
import { useRef, useState, useMemo, KeyboardEvent } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/cn";
import { useClickOutside, useEscapeKey, useControllable } from "../../lib/hooks";

export type ComboboxOption = { value: string; label: string };

type Props = {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
};

export function Combobox({
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Select...",
  emptyMessage = "No results.",
  className,
}: Props) {
  const [val, setVal] = useControllable(value, defaultValue, onValueChange);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(rootRef, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === val);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) {
        setVal(opt.value);
        setQuery("");
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative inline-block w-64", className)}>
      <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 focus-within:ring-2 focus-within:ring-ring">
        <input
          ref={inputRef}
          value={open ? query : selected?.label ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 max-h-60 w-full origin-top overflow-auto rounded-md border border-border bg-card py-1 shadow-md"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
            )}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === val;
              const isActive = i === active;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    setVal(opt.value);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  {opt.label}
                  {isSelected && <Check className="h-4 w-4" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
