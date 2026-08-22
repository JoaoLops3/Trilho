import type { Task, TaskStatus } from "../types/task";
import { loadTasks } from "./storage";
import { rolloverTasksIfNewDay } from "./day-rollover";
import { generateRoutineInstances } from "./routine-generator";
import { loadRoutines } from "./routine-storage";

export interface ActiveSession {
  taskId: string;
  startedAtMs: number;
  elapsedAtStart: number;
}

/** Elapsed baseado em relógio de parede — evita tick global a cada segundo. */
export function getWallClockElapsed(
  task: Task,
  session: ActiveSession | null,
): number {
  if (!session || session.taskId !== task.id || task.status !== "active") {
    return task.elapsed;
  }
  const delta = Math.floor((Date.now() - session.startedAtMs) / 1000);
  return Math.min(task.duration, session.elapsedAtStart + delta);
}

export function getInitialTasks(): Task[] {
  const loaded = loadTasks() ?? [];
  return generateRoutineInstances(
    rolloverTasksIfNewDay(loaded),
    loadRoutines(),
  );
}

export function applyCompletion(
  task: Task,
  status: TaskStatus,
  extra?: Partial<Task>,
): Task {
  if (status === "completed" && !task.completedAt) {
    return {
      ...task,
      ...extra,
      status,
      completedAt: new Date().toISOString(),
    };
  }
  return { ...task, ...extra, status };
}
