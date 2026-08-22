import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "../lib/motion";
import { Clock, X } from "lucide-react";
import { DurationFields } from "./DurationFields";
import { WeekdayPicker } from "./WeekdayPicker";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { useFocusTrap } from "../lib/a11y-focus";
import { dayKey } from "../lib/day-stats";
import {
  DEFAULT_DURATION_SECONDS,
  validateDurationSeconds,
} from "../lib/task-duration";
import { dayNumber, getWeekDays, weekdayShortLabel } from "../lib/week-utils";
import type { Task, TaskPriority } from "../types/task";
import type { RoutineTemplate, RoutineTemplateInput } from "../types/routine";

interface NewTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  taskToEdit?: Task | null;
  /** Dia pré-selecionado ao criar (ex.: dia ativo na Agenda). */
  defaultScheduledDate?: string;
  /** Habilita o modo "Repetir" (criação de rotina) no seletor do topo. */
  allowRoutineMode?: boolean;
  /** Força o modo rotina sem seletor (criação a partir de "Minhas rotinas"). */
  routineOnly?: boolean;
  onSubmitRoutine?: (input: RoutineTemplateInput, editingId?: string) => void;
  routineToEdit?: RoutineTemplate | null;
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

/** Dias úteis (seg–sex) como padrão inicial ao criar uma rotina nova. */
const DEFAULT_ROUTINE_WEEKDAYS = [1, 2, 3, 4, 5];

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
  defaultScheduledDate,
  allowRoutineMode = false,
  routineOnly = false,
  onSubmitRoutine,
  routineToEdit,
}: NewTaskSheetProps) {
  const keyboardInset = useKeyboardInset(isOpen);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  useFocusTrap(sheetRef, isOpen);
  const [mode, setMode] = useState<"task" | "routine">("task");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [durationSeconds, setDurationSeconds] = useState(
    DEFAULT_DURATION_SECONDS,
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledDate, setScheduledDate] = useState(dayKey());
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_ROUTINE_WEEKDAYS);

  // Edição fixa o modo; criação livre respeita allowRoutineMode.
  const isEditingRoutine = Boolean(routineToEdit);
  const isEditingTask = Boolean(taskToEdit);
  const isEditing = isEditingTask || isEditingRoutine;
  const showModeToggle = allowRoutineMode && !isEditing && !routineOnly;
  const isRoutine = mode === "routine";
  const today = dayKey();

  const dateChipDays = useMemo(() => {
    const anchorDay = scheduledDate || defaultScheduledDate || today;
    return getWeekDays(new Date(`${anchorDay}T00:00:00`));
  }, [scheduledDate, defaultScheduledDate, today]);

  useEffect(() => {
    if (isOpen) {
      if (routineToEdit) {
        setMode("routine");
        setTitle(routineToEdit.title);
        setCategory(routineToEdit.category);
        setDurationSeconds(routineToEdit.duration);
        setScheduledTime(routineToEdit.scheduledTime ?? "");
        setPriority(routineToEdit.priority);
        setWeekdays(routineToEdit.weekdays);
      } else if (taskToEdit) {
        setMode("task");
        setTitle(taskToEdit.title);
        setCategory(taskToEdit.category);
        setDurationSeconds(taskToEdit.duration);
        setScheduledTime(taskToEdit.scheduledTime ?? "");
        setScheduledDate(taskToEdit.scheduledDate ?? today);
        setPriority(taskToEdit.priority);
      } else {
        setMode(routineOnly ? "routine" : "task");
        setTitle("");
        setCategory(categories[0]);
        setDurationSeconds(DEFAULT_DURATION_SECONDS);
        setScheduledTime("");
        setScheduledDate(defaultScheduledDate ?? today);
        setPriority("medium");
        setWeekdays(DEFAULT_ROUTINE_WEEKDAYS);
      }

      const focusTimer = window.setTimeout(() => {
        titleInputRef.current?.focus();
      }, 320);
      return () => window.clearTimeout(focusTimer);
    }
  }, [
    isOpen,
    taskToEdit,
    routineToEdit,
    routineOnly,
    defaultScheduledDate,
    today,
  ]);

  const trimmedTitle = title.trim();
  const durationError = validateDurationSeconds(durationSeconds);
  const weekdaysError = isRoutine && weekdays.length === 0;
  const isValid = trimmedTitle.length > 0 && !durationError && !weekdaysError;

  const handleSubmit = () => {
    if (!isValid || durationError) return;
    const duration = durationSeconds;

    if (isRoutine) {
      if (!onSubmitRoutine || weekdays.length === 0) return;
      onSubmitRoutine(
        {
          title: trimmedTitle,
          category,
          duration,
          priority,
          scheduledTime: scheduledTime || undefined,
          weekdays,
        },
        routineToEdit?.id,
      );
      onClose();
      return;
    }

    const resolvedDate = scheduledDate || today;
    const task: Task = taskToEdit
      ? {
          ...taskToEdit,
          title: trimmedTitle,
          category,
          duration,
          elapsed: Math.min(taskToEdit.elapsed, duration),
          priority,
          scheduledTime: scheduledTime || undefined,
          scheduledDate: resolvedDate === today ? undefined : resolvedDate,
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
          // Legado: hoje sem campo; dias futuros/passados persistem scheduledDate.
          scheduledDate: resolvedDate === today ? undefined : resolvedDate,
        };
    onSubmit(task);
    onClose();
  };

  const heading = isRoutine
    ? isEditingRoutine
      ? "Editar rotina"
      : "Nova rotina"
    : isEditingTask
      ? "Editar tarefa"
      : "Nova tarefa";
  const submitLabel = isEditing
    ? "Salvar alterações"
    : isRoutine
      ? "Criar rotina"
      : "Adicionar tarefa";

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
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={heading}
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
                {heading}
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

            {showModeToggle && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
                {(["task", "routine"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={`rounded-xl py-2 text-sm font-medium transition-colors touch-manipulation ${
                      mode === option
                        ? "bg-mint-500/20 text-mint-400 border border-mint-500/40"
                        : "text-obsidian-300 border border-transparent hover:bg-white/[0.06]"
                    }`}
                  >
                    {option === "task" ? "Avulsa" : "Repetir"}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {!isRoutine && (
                <div>
                  <label className="block text-xs text-obsidian-400 uppercase tracking-wide mb-2">
                    Dia
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduledDate(today)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                        scheduledDate === today
                          ? "bg-mint-500/20 text-mint-400 border border-mint-500/40"
                          : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
                      }`}
                    >
                      Hoje
                    </button>
                    {dateChipDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setScheduledDate(day)}
                        className={`min-w-[2.75rem] px-2.5 py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                          scheduledDate === day
                            ? "bg-mint-500/20 text-mint-400 border border-mint-500/40"
                            : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
                        }`}
                        aria-label={`${weekdayShortLabel(day)} ${dayNumber(day)}`}
                      >
                        <span className="block text-[10px] leading-none text-obsidian-500 uppercase">
                          {weekdayShortLabel(day)}
                        </span>
                        <span className="block tabular-nums mt-0.5">
                          {dayNumber(day)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              {isRoutine && (
                <div>
                  <label className="block text-xs text-obsidian-400 uppercase tracking-wide mb-2">
                    Repetir em
                  </label>
                  <WeekdayPicker value={weekdays} onChange={setWeekdays} />
                  <p className="mt-2 text-xs text-obsidian-500">
                    Domingo a sábado, da esquerda para a direita.
                  </p>
                  {weekdaysError && (
                    <p className="mt-1 text-xs text-coral-400">
                      Selecione ao menos um dia.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className="btn-primary w-full mt-2 disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
              >
                {submitLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
