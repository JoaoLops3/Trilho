import { useState } from "react";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { ChevronLeft, Clock, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { OrbBackground } from "../components/OrbBackground";
import { NewTaskSheet } from "../components/NewTaskSheet";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { useRoutines } from "../lib/routines-context";
import { formatDuration } from "../lib/task-duration";
import type { RoutineTemplate } from "../types/routine";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

function describeWeekdays(weekdays: number[]): string {
  const set = new Set(weekdays);
  if (set.size === 7) return "Todos os dias";
  const weekdaysOnly = [1, 2, 3, 4, 5];
  if (set.size === 5 && weekdaysOnly.every((d) => set.has(d))) {
    return "Seg a sex";
  }
  return WEEKDAY_ORDER.filter((d) => set.has(d))
    .map((d) => WEEKDAY_LABELS[d])
    .join(" · ");
}

function RoutineRow({
  routine,
  onEdit,
  onToggle,
  onDelete,
}: {
  routine: RoutineTemplate;
  onEdit: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className={`p-4 ${routine.active ? "" : "opacity-50"}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate font-display font-medium text-base text-obsidian-100">
            {routine.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-obsidian-500">
            <span className="flex items-center gap-1">
              <Repeat className="h-3 w-3" strokeWidth={2} />
              {describeWeekdays(routine.weekdays)}
            </span>
            <span>{formatDuration(routine.duration)}</span>
            {routine.scheduledTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={2} />
                {routine.scheduledTime}
              </span>
            )}
          </div>
        </div>
        <ToggleSwitch
          checked={routine.active}
          onChange={onToggle}
          aria-label={`Ativar rotina ${routine.title}`}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-sm font-medium text-obsidian-200 transition-colors hover:bg-white/[0.08] touch-manipulation"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
          Editar
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirmingDelete) {
              onDelete();
            } else {
              setConfirmingDelete(true);
            }
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors touch-manipulation ${
            confirmingDelete
              ? "bg-coral-500/20 text-coral-400 border border-coral-500/40"
              : "border border-white/10 bg-white/[0.04] text-coral-400 hover:bg-white/[0.08]"
          }`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          {confirmingDelete ? "Confirmar" : "Excluir"}
        </button>
      </div>
    </div>
  );
}

export function RoutinesScreen() {
  const history = useHistory();
  const {
    routines,
    createRoutine,
    updateRoutine,
    setRoutineActive,
    deleteRoutine,
  } = useRoutines();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<RoutineTemplate | null>(
    null,
  );

  const openCreate = () => {
    setRoutineToEdit(null);
    setIsSheetOpen(true);
  };

  const openEdit = (routine: RoutineTemplate) => {
    setRoutineToEdit(routine);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setRoutineToEdit(null);
  };

  return (
    <IonPage>
      <IonContent scrollY={true} className="ion-content-custom">
        <OrbBackground />

        <div className="relative z-10 min-h-screen pb-32 md:mx-auto md:max-w-xl">
          <div className="px-4 pt-safe pb-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.button
                type="button"
                onClick={() => history.goBack()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-obsidian-200 transition-colors hover:bg-surface-tertiary touch-manipulation"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </motion.button>

              <h1 className="mt-3 mb-0 font-display font-semibold text-2xl text-white tracking-tight">
                Minhas rotinas
              </h1>
              <p className="text-obsidian-500 text-sm mt-1">
                Tarefas que se repetem nos dias escolhidos, criadas
                automaticamente a cada dia.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-mint-500/30 bg-mint-500/10 py-3 text-sm font-medium text-mint-400 transition-colors hover:bg-mint-500/20 touch-manipulation"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nova rotina
              </button>

              {routines.length === 0 ? (
                <div className="card-glass p-6 text-center text-sm text-obsidian-400">
                  Você ainda não tem rotinas. Crie uma para repetir tarefas
                  automaticamente nos dias que escolher.
                </div>
              ) : (
                <div className="card-glass divide-y divide-white/5 overflow-hidden">
                  {routines.map((routine) => (
                    <RoutineRow
                      key={routine.id}
                      routine={routine}
                      onEdit={() => openEdit(routine)}
                      onToggle={(active) =>
                        setRoutineActive(routine.id, active)
                      }
                      onDelete={() => deleteRoutine(routine.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <NewTaskSheet
          isOpen={isSheetOpen}
          onClose={closeSheet}
          onSubmit={() => {}}
          routineOnly
          routineToEdit={routineToEdit}
          onSubmitRoutine={(input, editingId) => {
            if (editingId) {
              updateRoutine(editingId, input);
            } else {
              createRoutine(input);
            }
          }}
        />
      </IonContent>
    </IonPage>
  );
}
