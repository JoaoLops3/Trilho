import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "../lib/motion";
import {
  Check,
  Clock,
  MoreVertical,
  Pencil,
  Repeat,
  RotateCcw,
  Trash2,
  Zap,
} from "lucide-react";
import { captureEvent } from "../lib/posthog";
import { taskAnalyticsProps } from "../lib/analytics-task";
import { formatDuration, formatTimerDisplay } from "../lib/task-duration";
import { useActiveElapsed } from "../lib/tasks-context";

export type TaskStatus = "active" | "pending" | "paused" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  category: string;
  duration: number;
  elapsed: number;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledTime?: string;
  /** Dia agendado "YYYY-MM-DD" (tarefa avulsa). Ausente = dia corrente. */
  scheduledDate?: string;
  /** ISO 8601 — preenchido ao concluir a tarefa */
  completedAt?: string;
  /** Id do template quando a tarefa é instância de uma rotina recorrente. */
  routineTemplateId?: string;
  /** dayKey "YYYY-MM-DD" da geração da instância (dedup por dia). */
  routineDate?: string;
}

interface TaskCardProps {
  task: Task;
  index: number;
  isActive?: boolean;
  highlighted?: boolean;
  /** Layout mais denso (ex.: home sem scroll). */
  compact?: boolean;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  Focus: "bg-electric-500/20 text-electric-400",
  Criativo: "bg-coral-500/20 text-coral-400",
  Saúde: "bg-mint-500/20 text-mint-400",
  Entretenimento: "bg-obsidian-400/20 text-obsidian-300",
  Comunicação: "bg-obsidian-400/20 text-obsidian-300",
  Default: "bg-obsidian-500/20 text-obsidian-300",
};

function getCategoryLabel(category: string): string {
  if (category === "Focus") return "Foco";
  if (category === "Comunicação") return "Entretenimento";
  return category;
}

export const TaskCard = memo(
  function TaskCard({
    task,
    index,
    isActive = false,
    highlighted = false,
    compact = false,
    onStatusChange,
    onEdit,
    onDelete,
  }: TaskCardProps) {
    const liveElapsed = useActiveElapsed(task);
    const effectiveElapsed =
      task.status === "active" ? liveElapsed : task.elapsed;
    const progress = (effectiveElapsed / task.duration) * 100;
    const remainingTime = task.duration - effectiveElapsed;
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasMenu = Boolean(onEdit || onDelete);

    useEffect(() => {
      if (!menuOpen) return;
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setMenuOpen(false);
          setConfirmingDelete(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const closeMenu = () => {
      setMenuOpen(false);
      setConfirmingDelete(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={menuOpen ? { zIndex: 40 } : undefined}
        className={`relative ${isActive ? "card-glass" : "card-premium"} ${
          compact ? "p-3" : "p-5"
        } transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] touch-manipulation ${
          highlighted
            ? "ring-2 ring-mint-400/60 ring-offset-2 ring-offset-surface-primary"
            : ""
        }`}
      >
        {isActive && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-mint-400 to-mint-500 origin-top"
              style={{ boxShadow: "0 0 20px rgba(52, 211, 153, 0.5)" }}
            />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mint-500/60 to-mint-400/60 origin-left"
            />
          </div>
        )}

        <div
          className={`relative flex items-start ${compact ? "gap-3" : "gap-4"}`}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const nextStatus = task.status === "active" ? "paused" : "active";
              const eventName =
                nextStatus === "active" ? "task started" : "task paused";
              captureEvent(eventName, taskAnalyticsProps(task));
              onStatusChange?.(task.id, nextStatus);
            }}
            className={`relative ${compact ? "w-10 h-10" : "w-12 h-12"} rounded-2xl flex items-center justify-center transition-colors duration-200 ${isActive ? "bg-mint-500/20" : "bg-surface-tertiary hover:bg-surface-elevated"}`}
            style={
              isActive ? { boxShadow: "0 0 20px rgba(52, 211, 153, 0.15)" } : {}
            }
          >
            {task.status === "active" ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap
                  className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-mint-400`}
                  strokeWidth={2}
                />
              </motion.div>
            ) : task.status === "paused" ? (
              <RotateCcw
                className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-obsidian-400`}
                strokeWidth={1.5}
              />
            ) : (
              <Check
                className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-obsidian-400`}
                strokeWidth={2}
              />
            )}

            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-mint-400/30"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>

          <div className="flex-1 min-w-0">
            <div
              className={`flex items-center gap-2 ${compact ? "mb-1" : "mb-2"}`}
            >
              <span
                className={`tiny px-2 py-0.5 rounded-lg text-xs font-medium ${categoryColors[task.category] || categoryColors["Default"]}`}
              >
                {getCategoryLabel(task.category)}
              </span>
              {task.scheduledTime && (
                <span className="text-xs text-obsidian-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={2} />
                  {task.scheduledTime}
                </span>
              )}
              {task.routineTemplateId && (
                <Repeat
                  className="w-3 h-3 text-obsidian-500"
                  strokeWidth={2}
                  aria-label="Tarefa recorrente"
                />
              )}
            </div>

            <h3
              className={`font-display font-medium ${compact ? "text-base" : "text-lg"} leading-tight tracking-tight mb-0.5 ${isActive ? "text-white" : "text-obsidian-200"}`}
            >
              {task.title}
            </h3>

            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <span className="font-display font-semibold text-mint-400 text-2xl tracking-tight tabular-nums">
                  {formatTimerDisplay(remainingTime)}
                </span>
                <span className="text-obsidian-500 text-sm">restantes</span>
              </motion.div>
            )}

            {!isActive && (
              <div className="flex items-center gap-2">
                <span className="text-obsidian-400 text-sm">
                  {formatDuration(task.duration)}
                </span>
                {task.status === "completed" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs text-mint-400 bg-mint-400/10 px-2 py-0.5 rounded-md"
                  >
                    Concluído
                  </motion.span>
                )}
              </div>
            )}
          </div>

          {hasMenu && (
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen((open) => !open)}
                className="p-2 text-obsidian-500 hover:text-obsidian-300 transition-colors touch-manipulation"
                aria-label="Opções da tarefa"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-1 w-44 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated/95 backdrop-blur-xl shadow-xl"
                  >
                    {onEdit && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          closeMenu();
                          onEdit(task.id);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-obsidian-200 hover:bg-white/[0.06] transition-colors touch-manipulation"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2} />
                        Editar
                      </button>
                    )}
                    {onDelete &&
                      (confirmingDelete ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            closeMenu();
                            onDelete(task.id);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-coral-400 bg-coral-500/10 hover:bg-coral-500/20 transition-colors touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                          Confirmar exclusão
                        </button>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => setConfirmingDelete(true)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-coral-400 hover:bg-white/[0.06] transition-colors touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                          Excluir
                        </button>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
  (prev, next) =>
    prev.task === next.task &&
    prev.isActive === next.isActive &&
    prev.highlighted === next.highlighted &&
    prev.index === next.index &&
    prev.onStatusChange === next.onStatusChange &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete,
);
