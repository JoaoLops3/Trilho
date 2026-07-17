import { useEffect } from "react";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { FocusWeekChart } from "../components/FocusWeekChart";
import { StatsWidget } from "../components/StatsWidget";
import { TrainStreakCard } from "../components/TrainStreakCard";
import { OrbBackground } from "../components/OrbBackground";
import { captureEvent } from "../lib/posthog";
import {
  computeFocusSeconds,
  computeGoalPercent,
  computeRecordStreak,
  computeTodayCompletedCount,
  computeWeekDots,
  filterTodayAgendaTasks,
  formatFocusTime,
  loadHistory,
} from "../lib/day-stats";
import { useDailyGoal } from "../lib/use-daily-goal";
import { useActiveElapsed, useTasks } from "../lib/tasks-context";

export function StatsScreen() {
  const { tasks, streak } = useTasks();

  const activeTask = tasks.find((t) => t.status === "active");
  const liveElapsed = useActiveElapsed(activeTask);
  const focusSeconds = activeTask
    ? computeFocusSeconds(tasks) - activeTask.elapsed + liveElapsed
    : computeFocusSeconds(tasks);
  const focusMinutes = Math.floor(focusSeconds / 60);
  const dailyGoal = useDailyGoal();
  const goalHours = Math.round(dailyGoal / 60);
  const focusPercent = computeGoalPercent(focusMinutes, dailyGoal);

  const todayAgenda = filterTodayAgendaTasks(tasks);
  const completedToday = computeTodayCompletedCount(tasks);
  const remainingTasks = todayAgenda.length - completedToday;
  const tasksPercent =
    todayAgenda.length > 0
      ? Math.round((completedToday / todayAgenda.length) * 100)
      : 0;

  const history = loadHistory();
  const recordDays = computeRecordStreak(history);
  const weekDots = computeWeekDots(history, tasks);

  useEffect(() => {
    captureEvent("stats viewed", {
      focus_minutes: focusMinutes,
      tasks_completed: completedToday,
      total_tasks: todayAgenda.length,
      streak_days: streak,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <IonPage>
      <IonContent scrollY={true} className="ion-content-custom">
        <OrbBackground />

        <div className="relative z-10 px-4 pt-safe pb-tab-bar md:mx-auto md:max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="m-0 font-display font-semibold text-2xl text-white tracking-tight">
              Estatísticas
            </h1>
            <p className="text-obsidian-500 text-sm mt-1">
              Seu progresso de hoje e dos últimos dias.
            </p>
          </motion.div>

          <div className="mt-4 flex flex-col gap-3 pb-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <StatsWidget
                stats={{
                  focusValue: formatFocusTime(focusMinutes),
                  focusGoalLabel: `${focusPercent}% da meta de ${goalHours}h`,
                  focusProgress: focusPercent,
                  tasksValue: `${completedToday} / ${todayAgenda.length}`,
                  tasksRemainingLabel: `${remainingTasks} ${remainingTasks === 1 ? "restante" : "restantes"} hoje`,
                  tasksProgress: tasksPercent,
                }}
              />
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <TrainStreakCard
                streakDays={streak}
                recordDays={recordDays}
                weekDots={weekDots}
              />
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-glass p-4"
            >
              <h2 className="font-display font-semibold text-lg text-white mb-1">
                Foco nos últimos 7 dias
              </h2>
              <p className="text-obsidian-500 text-xs mb-3">
                Quanto mais alta, mais você focou naquele dia.
              </p>
              <FocusWeekChart
                history={history}
                todayFocusSeconds={focusSeconds}
              />
            </motion.section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
