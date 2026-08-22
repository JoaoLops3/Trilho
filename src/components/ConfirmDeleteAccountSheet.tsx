import { useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "../lib/motion";
import { useFocusTrap } from "../lib/a11y-focus";

interface ConfirmDeleteAccountSheetProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteAccountSheet({
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: ConfirmDeleteAccountSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70"
            onClick={isDeleting ? undefined : onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-account-title"
            className="relative z-10 w-full max-w-xl rounded-t-[28px] border border-coral-500/20 bg-surface-secondary px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <h2
              id="confirm-delete-account-title"
              className="font-display text-xl font-semibold text-white"
            >
              Excluir conta?
            </h2>
            <p className="mt-2 text-sm text-obsidian-400 leading-relaxed">
              Isso apaga permanentemente sua conta, tarefas, histórico e dados
              na nuvem. Esta ação não pode ser desfeita.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-coral-400" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="btn-ghost flex-1 touch-manipulation disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="flex-1 rounded-2xl bg-coral-500/20 border border-coral-500/40 px-6 py-3 text-sm font-medium text-coral-400 hover:bg-coral-500/30 transition-colors touch-manipulation disabled:opacity-50"
              >
                {isDeleting ? "Excluindo…" : "Excluir conta"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
