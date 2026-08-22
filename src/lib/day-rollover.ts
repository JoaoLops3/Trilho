import type { Task } from "../types/task";

import { dayKey } from "./day-stats";
import { STORAGE_KEYS } from "./storage-keys";
import { taskDay } from "./week-utils";

const LAST_FOCUS_DAY_KEY = STORAGE_KEYS.lastFocusDay;

export function loadLastFocusDay(): string | null {
  try {
    return localStorage.getItem(LAST_FOCUS_DAY_KEY);
  } catch {
    return null;
  }
}

export function saveLastFocusDay(day: string): void {
  try {
    localStorage.setItem(LAST_FOCUS_DAY_KEY, day);
  } catch {
    // Storage indisponível: ignora silenciosamente.
  }
}

/**
 * Na virada do dia: zera elapsed de tarefas não concluídas do dia corrente/passado.
 * Tarefas de dias futuros não são tocadas. Pendentes de dias passados permanecem
 * no dia delas (não migram para hoje). Completed ficam intactas (prune em storage).
 */
export function rolloverTasksIfNewDay(
  tasks: Task[],
  today: string = dayKey(),
): Task[] {
  const lastDay = loadLastFocusDay();
  if (lastDay === today) return tasks;

  if (lastDay === null) {
    saveLastFocusDay(today);
    return tasks;
  }

  const rolled = tasks.map((task) => {
    if (task.status === "completed") return task;
    if (taskDay(task, today) > today) return task;
    return { ...task, elapsed: 0 };
  });

  saveLastFocusDay(today);
  return rolled;
}
