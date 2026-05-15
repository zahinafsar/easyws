"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Portal } from "./portal";
import { useEscapeKey, useFocusTrap } from "../../lib/hooks";
import { Button } from "./button";

type ConfirmProps = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  onConfirm?: () => void;
  onAsyncConfirm?: () => Promise<void>;
  onCancel?: () => void;
};

type ModalState = ConfirmProps & { show: boolean };

const initial: ModalState = { show: false, title: "" };

let setStateExternal: ((s: ModalState) => void) | null = null;

export function confirm(props: ConfirmProps) {
  if (!setStateExternal) {
    console.warn("confirm(): mount <ConfirmRoot /> once in your app");
    return;
  }
  setStateExternal({ ...props, show: true });
}

export function useConfirm() {
  return { confirm };
}

export function ConfirmRoot() {
  const [modal, setModal] = useState<ModalState>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStateExternal = setModal;
    return () => {
      setStateExternal = null;
    };
  }, []);

  const close = () => setModal((p) => ({ ...p, show: false }));

  const handleConfirm = async () => {
    if (modal.onAsyncConfirm) {
      setLoading(true);
      try {
        await modal.onAsyncConfirm();
      } finally {
        setLoading(false);
      }
    } else {
      modal.onConfirm?.();
    }
    close();
  };

  const handleCancel = () => {
    modal.onCancel?.();
    close();
  };

  useEscapeKey(handleCancel, modal.show);
  const trapRef = useFocusTrap<HTMLDivElement>(modal.show);

  return (
    <Portal>
      <AnimatePresence>
        {modal.show && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleCancel}
              className="fixed inset-0 z-50 bg-black/60"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                ref={trapRef}
                role="alertdialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-auto w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg"
              >
                <h2 className="text-lg font-semibold">{modal.title}</h2>
                {modal.message && (
                  <p className="mt-2 text-sm text-muted-foreground">{modal.message}</p>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={loading}>
                    {modal.cancelText ?? "Cancel"}
                  </Button>
                  <Button
                    variant={modal.variant ?? "primary"}
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? "..." : modal.confirmText ?? "Confirm"}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
