import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "../lib/motion";
import { Clock, X } from "lucide-react";
import { DurationFields } from "./DurationFields";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import {
  DEFAULT_DURATION_SECONDS,
  validateDurationSeconds,
} from "../lib/task-duration";
import type { Task, TaskPriority } from "./TaskCard";

interface NewTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  taskToEdit?: Task | null;
}

const categories = ["Focus", "Criativo", "Saúde", "Entretenimento"] as const;

const categoryLabels: Record<(typeof categories)[number], string> = {
  Focus: "Foco",
  Criativo: "Criativo",
  Saúde: "Saúde",
  Entretenimento: "Entretenimento",
};

const priorities: { id: TaskPriority; label: string }[] = [
  { id: "low", label: "Baixa" },
  { id: "medium", label: "Média" },
  { id: "high", label: "Alta" },
];

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const inputClass = "input-sheet";

export function NewTaskSheet({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
}: NewTaskSheetProps) {
  const isEditing = Boolean(taskToEdit);
  const keyboardInset = useKeyboardInset(isOpen);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [durationSeconds, setDurationSeconds] = useState(
    DEFAULT_DURATION_SECONDS,
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setCategory(taskToEdit.category);
        setDurationSeconds(taskToEdit.duration);
        setScheduledTime(taskToEdit.scheduledTime ?? "");
        setPriority(taskToEdit.priority);
      } else {
        setTitle("");
        setCategory(categories[0]);
        setDurationSeconds(DEFAULT_DURATION_SECONDS);
        setScheduledTime("");
        setPriority("medium");
      }

      const focusTimer = window.setTimeout(() => {
        titleInputRef.current?.focus();
      }, 320);
      return () => window.clearTimeout(focusTimer);
    }
  }, [isOpen, taskToEdit]);

  const trimmedTitle = title.trim();
  const durationError = validateDurationSeconds(durationSeconds);
  const isValid = trimmedTitle.length > 0 && !durationError;

  const handleSubmit = () => {
    if (!isValid || durationError) return;
    const duration = durationSeconds;
    const task: Task = taskToEdit
      ? {
          ...taskToEdit,
          title: trimmedTitle,
          category,
          duration,
          elapsed: Math.min(taskToEdit.elapsed, duration),
          priority,
          scheduledTime: scheduledTime || undefined,
        }
      : {
          id: createId(),
          title: trimmedTitle,
          category,
          duration,
          elapsed: 0,
          status: "pending",
          priority,
          scheduledTime: scheduledTime || undefined,
        };
    onSubmit(task);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{
            paddingBottom: Math.max(0, keyboardInset - 8),
            transition: "padding-bottom 0.25s ease-out",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-lg card-glass rounded-t-3xl rounded-b-none p-5 pb-8 max-h-[min(85dvh,100%)] overflow-y-auto"
            style={{
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-xl text-white">
                {isEditing ? "Editar tarefa" : "Nova tarefa"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-obsidian-400 hover:text-white hover:bg-white/[0.08] transition-colors touch-manipulation"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-obsidian-400 uppercase tracking-wide mb-2">
                  Título
                </label>
                <input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="Ex.: Sessão de trabalho profundo"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs text-obsidian-400 uppercase tracking-wide mb-2">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                        category === cat
                          ? "bg-mint-500/20 text-mint-400 border border-mint-500/40"
                          : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
                      }`}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <DurationFields
                  durationSeconds={durationSeconds}
                  onDurationChange={setDurationSeconds}
                  error={durationError}
                />
                <div className="shrink-0">
                  <label className="block text-xs text-obsidian-400 uppercase tracking-wide mb-2">
                    Horário
                  </label>
                  <div className="input-sheet-time-field relative flex h-12 w-[5.5rem] items-center justify-center">
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="input-sheet-time-overlay"
                      aria-label="Horário"
                    />
                    <div className="pointer-events-none flex items-center gap-1.5 text-sm tabular-nums">
                      <span
                        className={
                          scheduledTime ? "text-white" : "text-obsidian-500"
                        }
                      >
                        {scheduledTime || "--:--"}
                      </span>
                      <Clock
                        className="h-4 w-4 text-white/90"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-obsidian-400 uppercase tracking-wide mb-2">
                  Prioridade
                </label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                        priority === p.id
                          ? "bg-mint-500/20 text-mint-400 border border-mint-500/40"
                          : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className="btn-primary w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              >
                {isEditing ? "Salvar alterações" : "Adicionar tarefa"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
