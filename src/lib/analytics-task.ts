import type { Task } from "../types/task";

/** Propriedades de analytics para tarefas — sem PII (sem título). */
export function taskAnalyticsProps(
  task: Task,
  extra?: Record<string, string | number | boolean | null | undefined>,
) {
  return {
    task_id: task.id,
    task_category: task.category,
    task_priority: task.priority,
    task_duration_minutes: Math.floor(task.duration / 60),
    task_elapsed_minutes: Math.floor(task.elapsed / 60),
    has_scheduled_time: Boolean(task.scheduledTime),
    ...extra,
  };
}
