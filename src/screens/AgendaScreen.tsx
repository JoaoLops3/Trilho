import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { TaskCard } from "../components/TaskCard";
import { OrbBackground } from "../components/OrbBackground";
import { dayKey, sortByScheduledTime } from "../lib/day-stats";
import { useRoutines } from "../lib/routines-context";
import { useTasks } from "../lib/tasks-context";
import {
  addWeeks,
  dayNumber,
  formatWeekLabel,
  getWeekDays,
  startOfWeek,
  taskDay,
  weekdayShortLabel,
} from "../lib/week-utils";
import type { RoutineTemplate } from "../types/routine";

interface GhostRoutine {
  id: string;
  title: string;
  category: string;
  scheduledTime?: string;
  duration: number;
}

function ghostRoutinesForDay(
  routines: RoutineTemplate[],
  day: string,
  today: string,
  existingTasks: { routineTemplateId?: string; routineDate?: string }[],
): GhostRoutine[] {
  if (day <= today) return [];
  const weekday = new Date(`${day}T00:00:00`).getDay();
  return routines
    .filter((r) => r.active && r.weekdays.includes(weekday))
    .filter(
      (r) =>
        !existingTasks.some(
          (t) => t.routineTemplateId === r.id && t.routineDate === day,
        ),
    )
    .map((r) => ({
      id: `ghost:${r.id}:${day}`,
      title: r.title,
      category: r.category,
      scheduledTime: r.scheduledTime,
      duration: r.duration,
    }));
}

function GhostRoutineCard({ ghost }: { ghost: GhostRoutine }) {
  return (
    <div
      className="opacity-50 pointer-events-none select-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
      aria-hidden
    >
      <div className="flex items-center gap-2">
        <Repeat
          className="w-3.5 h-3.5 text-mint-400/80 shrink-0"
          strokeWidth={2}
        />
        <span className="text-sm text-white/80 font-medium truncate">
          {ghost.title}
        </span>
      </div>
      <p className="mt-1 text-xs text-obsidian-500">
        {ghost.category}
        {ghost.scheduledTime ? ` · ${ghost.scheduledTime}` : " · rotina"}
      </p>
    </div>
  );
}

export function AgendaScreen() {
  const {
    tasks,
    changeStatus,
    editTask,
    deleteTask,
    setCreateTaskDatePrefill,
  } = useTasks();
  const { routines } = useRoutines();
  const location = useLocation();
  const today = dayKey();
  const isAgendaActive = location.pathname === "/agenda";

  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(today);
  const touchStartX = useRef<number | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

  useEffect(() => {
    // Prefill do + só enquanto a Agenda está ativa (tabs Ionic ficam montadas).
    if (!isAgendaActive) {
      setCreateTaskDatePrefill(null);
      return;
    }
    setCreateTaskDatePrefill(selectedDay === today ? null : selectedDay);
  }, [isAgendaActive, selectedDay, today, setCreateTaskDatePrefill]);

  useEffect(() => {
    return () => setCreateTaskDatePrefill(null);
  }, [setCreateTaskDatePrefill]);

  const dayTasks = useMemo(
    () => tasks.filter((t) => taskDay(t, today) === selectedDay),
    [tasks, selectedDay, today],
  );

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of weekDays) map.set(day, 0);
    for (const task of tasks) {
      const day = taskDay(task, today);
      if (map.has(day)) map.set(day, (map.get(day) ?? 0) + 1);
    }
    return map;
  }, [tasks, weekDays, today]);

  const timedPending = sortByScheduledTime(
    dayTasks.filter(
      (t) =>
        (t.status === "pending" || t.status === "paused") &&
        Boolean(t.scheduledTime),
    ),
  );
  const untimedTasks = dayTasks.filter(
    (t) =>
      (t.status === "pending" || t.status === "paused") && !t.scheduledTime,
  );
  const activeTasks = dayTasks.filter((t) => t.status === "active");
  const completedTasks = dayTasks.filter((t) => t.status === "completed");

  const ghosts = useMemo(
    () => ghostRoutinesForDay(routines, selectedDay, today, tasks),
    [routines, selectedDay, today, tasks],
  );
  const timedGhosts = ghosts.filter((g) => Boolean(g.scheduledTime));
  const untimedGhosts = ghosts.filter((g) => !g.scheduledTime);

  const goWeek = (delta: number) => {
    const next = addWeeks(weekAnchor, delta);
    setWeekAnchor(next);
    const days = getWeekDays(next);
    if (!days.includes(selectedDay)) {
      setSelectedDay(days.includes(today) ? today : days[0]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    // Evita conflito com swipe-back do iOS (borda esquerda).
    if (startX < 24) return;
    const dx = endX - startX;
    if (Math.abs(dx) < 48) return;
    goWeek(dx < 0 ? 1 : -1);
  };

  return (
    <IonPage>
      <IonContent
        scrollY={true}
        className="ion-content-custom ion-content-with-tab-bar"
      >
        <OrbBackground />

        <div className="relative z-10 min-h-full md:mx-auto md:max-w-xl">
          <div className="px-4 pt-safe pb-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex items-center justify-between"
            >
              <h1 className="m-0 font-display font-semibold text-2xl text-white tracking-tight">
                Agenda
              </h1>
              <span className="text-obsidian-500 text-sm">
                {dayTasks.length} tarefas
              </span>
            </motion.div>

            <div
              className="space-y-3"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => goWeek(-1)}
                  className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-obsidian-300 hover:text-white touch-manipulation"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="text-sm text-obsidian-300 font-medium capitalize">
                  {formatWeekLabel(weekAnchor)}
                </span>
                <button
                  type="button"
                  onClick={() => goWeek(1)}
                  className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-obsidian-300 hover:text-white touch-manipulation"
                  aria-label="Próxima semana"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                  const isToday = day === today;
                  const isSelected = day === selectedDay;
                  const count = countsByDay.get(day) ?? 0;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-colors touch-manipulation ${
                        isSelected
                          ? "border border-mint-500/50 bg-mint-500/10"
                          : "border border-transparent bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                      aria-label={`${weekdayShortLabel(day)} ${dayNumber(day)}`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={`text-[10px] uppercase tracking-wide ${
                          isToday ? "text-mint-400" : "text-obsidian-500"
                        }`}
                      >
                        {weekdayShortLabel(day)}
                      </span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isToday ? "text-mint-400" : "text-white"
                        }`}
                      >
                        {dayNumber(day)}
                      </span>
                      {isToday && (
                        <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-mint-400" />
                      )}
                      {count > 0 && (
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTasks.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-display font-semibold text-lg text-white">
                    Em Andamento
                  </h2>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-mint-400"
                  />
                </div>
                <div className="space-y-3">
                  {activeTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isActive={task.status === "active"}
                      onStatusChange={changeStatus}
                      onEdit={editTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-display font-semibold text-lg text-white">
                  Próximas
                </h2>
                <span className="text-obsidian-500 text-sm">
                  {timedPending.length + timedGhosts.length} tarefas
                </span>
              </div>
              {timedPending.length > 0 || timedGhosts.length > 0 ? (
                <div className="space-y-3">
                  {timedPending.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={changeStatus}
                      onEdit={editTask}
                      onDelete={deleteTask}
                    />
                  ))}
                  {timedGhosts.map((ghost) => (
                    <GhostRoutineCard key={ghost.id} ghost={ghost} />
                  ))}
                </div>
              ) : (
                <p className="text-obsidian-500 text-sm px-1">
                  Nenhuma tarefa com horário.
                </p>
              )}
            </motion.section>

            {(untimedTasks.length > 0 || untimedGhosts.length > 0) && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-display font-semibold text-lg text-white">
                    Sem horário
                  </h2>
                  <span className="text-obsidian-500 text-sm">
                    {untimedTasks.length + untimedGhosts.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {untimedTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={changeStatus}
                      onEdit={editTask}
                      onDelete={deleteTask}
                    />
                  ))}
                  {untimedGhosts.map((ghost) => (
                    <GhostRoutineCard key={ghost.id} ghost={ghost} />
                  ))}
                </div>
              </motion.section>
            )}

            {completedTasks.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-display font-semibold text-lg text-white">
                    Concluídas
                  </h2>
                  <span className="text-mint-400 text-sm">
                    {completedTasks.length} feitas
                  </span>
                </div>
                <div className="space-y-3 opacity-60">
                  {completedTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={changeStatus}
                      onEdit={editTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {dayTasks.length === 0 && ghosts.length === 0 && (
              <p className="text-obsidian-500 text-sm px-1 pt-2">
                Nada agendado neste dia.
              </p>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
