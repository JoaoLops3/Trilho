import type { Task } from "../types/task";

import { STORAGE_KEYS } from "./storage-keys";

const STORAGE_KEY = STORAGE_KEYS.tasks;

export const COMPLETED_RETENTION_DAYS = 14;

export function pruneCompletedTasks(tasks: Task[], now = new Date()): Task[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - COMPLETED_RETENTION_DAYS);

  return tasks.filter((task) => {
    if (task.status !== "completed") return true;
    if (!task.completedAt) return true;
    return new Date(task.completedAt) >= cutoff;
  });
}

export function loadTasks(): Task[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const tasks = parsed as Task[];
    const pruned = pruneCompletedTasks(tasks);
    if (pruned.length !== tasks.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return null;
  }
}

export function saveTasks(tasks: Task[]): Task[] {
  try {
    const pruned = pruneCompletedTasks(tasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    return pruned;
  } catch {
    return tasks;
  }
}
