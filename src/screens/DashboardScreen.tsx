import { useEffect, useMemo, useRef } from "react";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { HeaderBar } from "../components/HeaderBar";
import { TaskCard } from "../components/TaskCard";
import { ProgressRing } from "../components/ProgressRing";
import { OrbBackground } from "../components/OrbBackground";
import { captureEvent } from "../lib/posthog";
import {
  computeFocusSeconds,
  dayKey,
  sortByScheduledTime,
} from "../lib/day-stats";
import { formatTimerDisplay } from "../lib/task-duration";
import { useDailyGoal } from "../lib/use-daily-goal";
import { useActiveElapsed, useTasks } from "../lib/tasks-context";
import { useProfile } from "../lib/profile-context";
import { getShownName } from "../lib/profile-storage";
import { taskDay } from "../lib/week-utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 17) return "Boa tarde";
  return "Boa noite";
}

export function DashboardScreen() {
  const history = useHistory();
  const location = useLocation();
  const { tasks, changeStatus, editTask, deleteTask } = useTasks();
  const { profile } = useProfile();
  const taskRefs = useRef<Record<string, HTMLElement | null>>({});

  const highlightTaskId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("highlightTask");
  }, [location.search]);

  useEffect(() => {
    if (!highlightTaskId) return;
    const timeout = setTimeout(() => {
      history.replace("/");
    }, 4000);
    return () => clearTimeout(timeout);
  }, [highlightTaskId, history]);

  const renderTaskCard = (
    task: (typeof tasks)[number],
    index: number,
    isActive = false,
  ) => (
    <div
      key={task.id}
      ref={(el) => {
        taskRefs.current[task.id] = el;
      }}
    >
      <TaskCard
        task={task}
        index={index}
        isActive={isActive}
        compact
        highlighted={highlightTaskId === task.id}
        onStatusChange={changeStatus}
        onEdit={editTask}
        onDelete={deleteTask}
      />
    </div>
  );

  const activeTask = tasks.find((t) => t.status === "active");
  const liveElapsed = useActiveElapsed(activeTask);
  const focusSeconds = activeTask
    ? computeFocusSeconds(tasks) - activeTask.elapsed + liveElapsed
    : computeFocusSeconds(tasks);
  const focusMinutes = Math.floor(focusSeconds / 60);
  const dailyGoalMinutes = useDailyGoal();
  const goalHours = Math.round(dailyGoalMinutes / 60);
  const sessionProgress = activeTask
    ? Math.min((liveElapsed / activeTask.duration) * 100, 100)
    : 0;
  const sessionRemaining = activeTask
    ? Math.max(activeTask.duration - liveElapsed, 0)
    : 0;

  const today = dayKey();
  const upcomingTasks = sortByScheduledTime(
    tasks.filter(
      (t) => t.status === "pending" && taskDay(t, today) === today,
    ),
  );
  // Sem scroll: mostra até 3 próximas na home.
  const visibleUpcoming = upcomingTasks.slice(0, 3);

  const handleViewAllTasks = () => {
    captureEvent("view all tasks tapped", {
      upcoming_tasks: upcomingTasks.length,
      total_tasks: tasks.length,
    });
    history.push("/agenda");
  };

  return (
    <IonPage>
      <IonContent
        scrollY={false}
        forceOverscroll={false}
        className="ion-content-custom ion-content-auth"
      >
        <OrbBackground />

        <div className="relative z-10 flex h-full flex-col overflow-hidden pb-tab-bar md:mx-auto md:max-w-xl">
          <HeaderBar
            greeting={getGreeting()}
            userName={getShownName(profile)}
            avatarSeed={profile.avatarSeed}
            avatarStyle={profile.avatarStyle}
          />

          <div className="flex flex-col gap-3 overflow-hidden px-4 pt-1">
            {activeTask && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="shrink-0"
                ref={(el) => {
                  taskRefs.current[activeTask.id] = el;
                }}
              >
                <div
                  className={`card-glass p-4 ${
                    highlightTaskId === activeTask.id
                      ? "ring-2 ring-mint-400/60 ring-offset-2 ring-offset-surface-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <ProgressRing
                      progress={sessionProgress}
                      size={88}
                      strokeWidth={6}
                    >
                      <p
                        className={`m-0 font-display font-bold text-white leading-none tabular-nums ${
                          sessionRemaining >= 3600 ? "text-[13px]" : "text-lg"
                        }`}
                      >
                        {formatTimerDisplay(sessionRemaining)}
                      </p>
                      <p className="m-0 mt-1 text-[8px] text-obsidian-500 uppercase tracking-wide leading-none whitespace-nowrap">
                        restando
                      </p>
                    </ProgressRing>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <motion.span
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.6, 1],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-2.5 w-2.5 rounded-full bg-mint-400"
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-mint-400">
                          Em Andamento
                        </span>
                      </div>
                      <h2 className="mb-1 truncate font-display text-lg font-semibold text-white">
                        {activeTask.title}
                      </h2>
                      <p className="mb-2.5 text-sm text-obsidian-400">
                        Foco hoje: {focusMinutes}m / {goalHours}h
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeStatus(activeTask.id, "paused")}
                          className="rounded-xl border border-mint-500/30 bg-mint-500/10 px-3.5 py-1.5 text-sm font-medium text-mint-400 transition-colors hover:bg-mint-500/20 touch-manipulation"
                        >
                          Pausar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(activeTask.id, "completed")
                          }
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-obsidian-300 transition-colors hover:bg-white/[0.08] touch-manipulation"
                        >
                          Encerrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="shrink-0"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="font-display text-base font-semibold text-white">
                  Próximas
                </h2>
                <span className="text-sm text-obsidian-500">
                  {upcomingTasks.length} tarefas
                </span>
              </div>

              {visibleUpcoming.length > 0 ? (
                <div className="space-y-2">
                  {visibleUpcoming.map((task, index) =>
                    renderTaskCard(task, index),
                  )}
                </div>
              ) : (
                <div className="card-glass flex flex-col items-center justify-center px-6 py-6 text-center">
                  <p className="font-display text-base font-medium text-white">
                    Nenhuma tarefa no momento
                  </p>
                  <p className="mt-1 text-sm text-obsidian-500">
                    Toque no + para criar sua primeira tarefa.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleViewAllTasks}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-mint-400 transition-colors hover:bg-white/[0.08] touch-manipulation"
              >
                Ver todas
              </button>
            </motion.section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
