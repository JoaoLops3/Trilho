import type { Task } from "../components/TaskCard";

import { STORAGE_KEYS } from "./storage-keys";

const HISTORY_KEY = STORAGE_KEYS.history;
const HISTORY_MAX_DAYS = 90;

/** Estatísticas consolidadas de um dia (datas em horário local, formato YYYY-MM-DD). */
export interface DayStat {
  date: string;
  tasksCompleted: number;
  focusSeconds: number;
}

export type DayDotStatus =
  | "full"
  | "partial"
  | "empty"
  | "today-full"
  | "today-partial";

export interface DayDot {
  status: DayDotStatus;
}

/** Chave de dia (YYYY-MM-DD) em horário local. */
export function dayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loadHistory(): DayStat[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DayStat[];
  } catch {
    return [];
  }
}

export function saveHistory(history: DayStat[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage indisponível: ignora silenciosamente.
  }
}

/** Registra (upsert) o snapshot do dia atual e retorna o histórico atualizado. */
export function recordToday(stat: {
  tasksCompleted: number;
  focusSeconds: number;
}): DayStat[] {
  const date = dayKey();
  const history = loadHistory();
  const entry: DayStat = { date, ...stat };
  const index = history.findIndex((d) => d.date === date);
  if (index >= 0) {
    history[index] = entry;
  } else {
    history.push(entry);
  }
  const trimmed = history.slice(-HISTORY_MAX_DAYS);
  saveHistory(trimmed);
  return trimmed;
}

/** Conta dias consecutivos (terminando hoje) com pelo menos uma tarefa concluída. */
export function computeStreak(
  history: DayStat[],
  today: string = dayKey(),
): number {
  const completedDays = new Set(
    history.filter((d) => d.tasksCompleted > 0).map((d) => d.date),
  );
  const cursor = new Date(`${today}T00:00:00`);
  // Se hoje ainda não tem conclusão, não quebra a sequência: conta a partir de ontem.
  if (!completedDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (completedDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Maior sequência consecutiva de dias com pelo menos uma tarefa concluída. */
export function computeRecordStreak(history: DayStat[]): number {
  const completedDays = new Set(
    history.filter((d) => d.tasksCompleted > 0).map((d) => d.date),
  );
  if (completedDays.size === 0) return 0;

  const sorted = [...completedDays].sort();
  let max = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    prev.setDate(prev.getDate() + 1);
    if (dayKey(prev) === sorted[i]) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return max;
}

/** Últimos 7 dias para os dots do TrainStreakCard (índice 0 = mais antigo). */
export function computeWeekDots(
  history: DayStat[],
  tasks: Task[],
  today: string = dayKey(),
): DayDot[] {
  const byDate = new Map(history.map((d) => [d.date, d]));
  const dots: DayDot[] = [];
  const cursor = new Date(`${today}T00:00:00`);
  cursor.setDate(cursor.getDate() - 6);

  const todayAgenda = filterTodayAgendaTasks(tasks, today);
  const totalToday = todayAgenda.length;
  const completedToday = computeTodayCompletedCount(tasks, today);

  for (let i = 0; i < 7; i += 1) {
    const key = dayKey(cursor);
    const isToday = key === today;

    if (isToday) {
      if (totalToday === 0 || completedToday === 0) {
        dots.push({ status: "empty" });
      } else if (completedToday === totalToday) {
        dots.push({ status: "today-full" });
      } else {
        dots.push({ status: "today-partial" });
      }
    } else {
      const completed = byDate.get(key)?.tasksCompleted ?? 0;
      dots.push({ status: completed === 0 ? "empty" : "full" });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dots;
}

export function sortByScheduledTime(tasks: Task[]): Task[] {
  const toMinutes = (time?: string): number => {
    if (!time) return Number.POSITIVE_INFINITY;
    const [hours, mins] = time
      .split(":")
      .map((part) => Number.parseInt(part, 10));
    if (Number.isNaN(hours) || Number.isNaN(mins))
      return Number.POSITIVE_INFINITY;
    return hours * 60 + mins;
  };

  return [...tasks].sort(
    (a, b) => toMinutes(a.scheduledTime) - toMinutes(b.scheduledTime),
  );
}

export function isTaskCompletedOnDay(
  task: Task,
  day: string = dayKey(),
): boolean {
  return (
    task.status === "completed" &&
    !!task.completedAt &&
    dayKey(new Date(task.completedAt)) === day
  );
}

/** Tarefas do dia: pendentes/ativas/pausadas do dia + concluídas nesse dia. */
export function isTaskInTodayAgenda(
  task: Task,
  day: string = dayKey(),
): boolean {
  if (task.status !== "completed") {
    // Mesma regra de week-utils.taskDay (evita import circular day-stats ↔ week-utils).
    const assignedDay = task.scheduledDate ?? task.routineDate ?? day;
    return assignedDay === day;
  }
  return isTaskCompletedOnDay(task, day);
}

export function filterTodayAgendaTasks(
  tasks: Task[],
  day: string = dayKey(),
): Task[] {
  return tasks.filter((task) => isTaskInTodayAgenda(task, day));
}

export function computeTodayCompletedCount(
  tasks: Task[],
  day: string = dayKey(),
): number {
  return tasks.filter((task) => isTaskCompletedOnDay(task, day)).length;
}

/** Soma foco apenas do dia atual (concluídas hoje + timer de ativas/pausadas). */
export function computeFocusSeconds(
  tasks: Task[],
  day: string = dayKey(),
): number {
  return tasks.reduce((sum, task) => {
    if (task.status === "completed") {
      if (!isTaskCompletedOnDay(task, day)) return sum;
      return sum + task.elapsed;
    }
    if (task.status === "active" || task.status === "paused") {
      return sum + task.elapsed;
    }
    return sum;
  }, 0);
}

export function formatFocusTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function computeGoalPercent(
  focusMinutes: number,
  dailyGoalMinutes: number,
): number {
  if (dailyGoalMinutes <= 0) return 0;
  return Math.min(Math.round((focusMinutes / dailyGoalMinutes) * 100), 100);
}

export function computeGoalProgressPercent(
  focusMinutes: number,
  dailyGoalMinutes: number,
): string {
  return `${computeGoalPercent(focusMinutes, dailyGoalMinutes)}% meta`;
}
