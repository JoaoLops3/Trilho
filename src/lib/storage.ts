import type { Task } from "../types/task";

import { taskSchema } from "./storage-schemas";
import { parseStorageArray } from "./storage-runtime";
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
    const tasks = parseStorageArray(
      localStorage.getItem(STORAGE_KEY),
      taskSchema,
      {
        storageKey: STORAGE_KEY,
        operation: "load_tasks",
      },
    );
    if (!tasks) return null;
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
