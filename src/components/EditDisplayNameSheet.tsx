import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "../lib/motion";
import { useProfile } from "../lib/profile-context";
import { useUpdateNickname } from "../hooks/useUpdateNickname";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { useToast } from "../lib/toast-context";
import { useFocusTrap } from "../lib/a11y-focus";
import {
  getShownName,
  PROFILE_HEADER_NAME_MAX_LENGTH,
} from "../lib/profile-storage";

const inputClass =
  "w-full min-w-0 rounded-2xl border bg-white/[0.04] py-3.5 text-sm text-white placeholder:text-obsidian-600 outline-none transition-colors focus:border-mint-500/50 focus:ring-1 focus:ring-mint-500/30 px-4";

interface EditDisplayNameSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditDisplayNameSheet({
  isOpen,
  onClose,
}: EditDisplayNameSheetProps) {
  const { profile } = useProfile();
  const { updateNickname, resetNickname, isSaving, error } =
    useUpdateNickname();
  const toast = useToast();
  const keyboardInset = useKeyboardInset(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useFocusTrap(panelRef, isOpen);

  const isDirty = nickname !== initialValue;
  const accountNameDisplay = profile.accountName
    .trim()
    .slice(0, PROFILE_HEADER_NAME_MAX_LENGTH);
  const hasCustomNickname = profile.nickname !== null;

  // Ativo se há apelido salvo para limpar, ou se o usuário editou para algo ≠ nome do cadastro
  const canReset =
    hasCustomNickname || (isDirty && nickname.trim() !== accountNameDisplay);

  useEffect(() => {
    if (isOpen) {
      const shown = getShownName(profile).slice(
        0,
        PROFILE_HEADER_NAME_MAX_LENGTH,
      );
      setInitialValue(shown);
      setNickname(shown);
      setFieldError(null);
      const focusTimer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 320);
      return () => window.clearTimeout(focusTimer);
    }
  }, [isOpen, profile]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldError(null);

    try {
      await updateNickname(nickname);
      toast.success("Nome atualizado");
      onClose();
    } catch (err) {
      setFieldError(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
    }
  };

  const handleReset = async () => {
    setFieldError(null);
    try {
      await resetNickname();
      toast.success("Nome restaurado");
      onClose();
    } catch (err) {
      setFieldError(
        err instanceof Error ? err.message : "Não foi possível resetar.",
      );
    }
  };

  const displayError = fieldError ?? error;
  const isAtMaxLength = nickname.length >= PROFILE_HEADER_NAME_MAX_LENGTH;

  const actionButtonClass =
    "box-border flex flex-1 h-12 min-h-12 items-center justify-center rounded-2xl border px-4 text-sm font-medium touch-manipulation disabled:opacity-50";

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
            className="absolute inset-0 bg-black/60"
            onClick={isSaving ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Editar nome"
            className="relative w-full max-w-lg card-glass rounded-t-3xl rounded-b-none px-7 py-5 pb-8 max-h-[min(85dvh,100%)] overflow-y-auto"
            style={{
              marginBottom: Math.max(0, keyboardInset - 8),
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
              transition: "margin-bottom 0.25s ease-out",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

            <div className="mb-5">
              <h2 className="font-display text-xl font-semibold text-white">
                Editar nome
              </h2>
              <p className="mt-1 text-sm text-obsidian-400">
                Como quer ser chamado no app?
              </p>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-nickname"
                  className="block text-xs font-medium text-obsidian-400"
                >
                  Nome no app
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    id="edit-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) =>
                      setNickname(
                        e.target.value.slice(0, PROFILE_HEADER_NAME_MAX_LENGTH),
                      )
                    }
                    autoComplete="nickname"
                    placeholder="Como quer ser chamado?"
                    maxLength={PROFILE_HEADER_NAME_MAX_LENGTH}
                    className={`${inputClass} ${
                      displayError ? "border-coral-500/60" : "border-white/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => void handleReset()}
                    disabled={isSaving || !canReset}
                    aria-label="Usar nome do cadastro"
                    aria-disabled={isSaving || !canReset}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-obsidian-400 transition-[color,opacity,background-color] hover:bg-white/[0.08] hover:text-obsidian-200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:text-obsidian-400 touch-manipulation"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2 pt-0.5">
                  {displayError ? (
                    <p className="text-xs text-coral-400" role="alert">
                      {displayError}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p
                    className={`shrink-0 text-xs transition-colors ${
                      isAtMaxLength ? "text-coral-400" : "text-obsidian-500"
                    }`}
                  >
                    {nickname.length}/{PROFILE_HEADER_NAME_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className={`${actionButtonClass} border-white/10 bg-white/[0.04] text-obsidian-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${actionButtonClass} btn-primary !px-4 !py-0 border-transparent disabled:cursor-not-allowed`}
                >
                  {isSaving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
