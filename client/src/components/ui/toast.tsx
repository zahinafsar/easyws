"use client";
import { ReactNode, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Portal } from "./portal";
import { cn } from "../../lib/cn";

export type ToastVariant = "default" | "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title?: string;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

type Store = {
  items: ToastItem[];
  listeners: Set<() => void>;
};

const store: Store = { items: [], listeners: new Set() };

function emit() {
  store.listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  store.listeners.add(l);
  return () => {
    store.listeners.delete(l);
  };
}

function getSnapshot() {
  return store.items;
}

export function toast(t: Omit<ToastItem, "id">) {
  const id = Math.random().toString(36).slice(2);
  const item: ToastItem = { duration: 4000, variant: "default", ...t, id };
  store.items = [...store.items, item];
  emit();
  if (item.duration && item.duration > 0) {
    setTimeout(() => dismissToast(id), item.duration);
  }
  return id;
}

export function dismissToast(id: string) {
  store.items = store.items.filter((t) => t.id !== id);
  emit();
}

const icons = {
  default: null,
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => store.items);

  return (
    <Portal>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-md border border-border bg-card p-4 shadow-lg"
              )}
            >
              {icons[t.variant ?? "default"]}
              <div className="flex-1">
                {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                {t.description && <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss"
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
