import type { Task } from "../components/TaskCard";
import type { NotificationType } from "../types/notification";
import type { NewNotification } from "./notification-storage";
import { dayKey } from "./day-stats";

export interface NotificationCopy {
  title: string;
  body: string;
}

export interface NotificationCopyOptions {
  hideTaskContent?: boolean;
}

export function taskUpcomingDedupKey(taskId: string, date?: Date): string {
  return `task-upcoming:${taskId}:${dayKey(date)}`;
}

export function taskOverdueDedupKey(taskId: string, date?: Date): string {
  return `task-overdue:${taskId}:${dayKey(date)}`;
}

export function timerFinishedDedupKey(taskId: string): string {
  return `timer-finished:${taskId}`;
}

export function taskCompletedDedupKey(taskId: string): string {
  return `task-completed:${taskId}`;
}

export function dailyGoalDedupKey(date?: Date): string {
  return `goal:${dayKey(date)}`;
}

export function streakMilestoneDedupKey(streak: number): string {
  return `streak:${streak}`;
}

export function streakAtRiskDedupKey(date?: Date): string {
  return `streak-risk:${dayKey(date)}`;
}

export function buildTaskUpcomingCopy(
  task: Task,
  options?: NotificationCopyOptions,
): NotificationCopy {
  if (options?.hideTaskContent) {
    return {
      title: "Tarefa chegando",
      body: "Você tem uma tarefa chegando.",
    };
  }
  return {
    title: "Tarefa chegando",
    body: `${task.title} começa às ${task.scheduledTime}. Prepare-se para iniciar.`,
  };
}

export function buildTaskOverdueCopy(
  task: Task,
  options?: NotificationCopyOptions,
): NotificationCopy {
  if (options?.hideTaskContent) {
    return {
      title: "Tarefa atrasada",
      body: "Há uma tarefa atrasada no seu dia.",
    };
  }
  return {
    title: "Tarefa atrasada",
    body: `${task.title} era às ${task.scheduledTime} e ainda não foi iniciada.`,
  };
}

export function buildTimerFinishedCopy(
  task: Task,
  options?: NotificationCopyOptions,
): NotificationCopy {
  if (options?.hideTaskContent) {
    return {
      title: "Tarefa concluída",
      body: "Uma sessão de foco terminou.",
    };
  }
  return {
    title: "Tarefa concluída",
    body: `Você concluiu ${task.title}. Bom trabalho!`,
  };
}

export function buildTaskCompletedCopy(
  task: Task,
  options?: NotificationCopyOptions,
): NotificationCopy {
  if (options?.hideTaskContent) {
    return {
      title: "Tarefa concluída",
      body: "Você concluiu uma tarefa. Bom trabalho!",
    };
  }
  return {
    title: "Tarefa concluída",
    body: `Você concluiu ${task.title}. Bom trabalho!`,
  };
}

export function buildDailyGoalCopy(goalHours: number): NotificationCopy {
  return {
    title: "Meta diária atingida",
    body: `Você bateu a meta de ${goalHours}h de foco hoje. Continue assim!`,
  };
}

export function buildStreakMilestoneCopy(streak: number): NotificationCopy {
  return {
    title: `Sequência de ${streak} dias`,
    body: `${streak} dias seguidos com tarefas concluídas. Incrível!`,
  };
}

export function buildStreakAtRiskCopy(streak: number): NotificationCopy {
  return {
    title: "Não perca sua sequência",
    body: `Você ainda não concluiu nenhuma tarefa hoje. Falta pouco para manter os ${streak} dias!`,
  };
}

export function buildTaskUpcomingEntry(
  task: Task,
  date?: Date,
  options?: NotificationCopyOptions,
): NewNotification {
  const copy = buildTaskUpcomingCopy(task, options);
  return {
    type: "task_upcoming",
    ...copy,
    dedupKey: taskUpcomingDedupKey(task.id, date),
    taskId: task.id,
  };
}

export function buildTaskOverdueEntry(
  task: Task,
  date?: Date,
  options?: NotificationCopyOptions,
): NewNotification {
  const copy = buildTaskOverdueCopy(task, options);
  return {
    type: "task_overdue",
    ...copy,
    dedupKey: taskOverdueDedupKey(task.id, date),
    taskId: task.id,
  };
}

export function buildTimerFinishedEntry(
  task: Task,
  options?: NotificationCopyOptions,
): NewNotification {
  const copy = buildTimerFinishedCopy(task, options);
  return {
    type: "timer_finished",
    ...copy,
    dedupKey: timerFinishedDedupKey(task.id),
    taskId: task.id,
  };
}

export function buildTaskCompletedEntry(
  task: Task,
  options?: NotificationCopyOptions,
): NewNotification {
  const copy = buildTaskCompletedCopy(task, options);
  return {
    type: "task_completed",
    ...copy,
    dedupKey: taskCompletedDedupKey(task.id),
    taskId: task.id,
  };
}

export interface NativeNotificationExtra {
  type?: NotificationType;
  taskId?: string;
  dedupKey?: string;
  title?: string;
  body?: string;
}

export function parseNativeNotificationExtra(
  extra: unknown,
): NativeNotificationExtra {
  if (!extra || typeof extra !== "object") return {};
  return extra as NativeNotificationExtra;
}

export function extraToInboxEntry(
  extra: NativeNotificationExtra,
): NewNotification | null {
  if (!extra.type || !extra.dedupKey || !extra.title || !extra.body) {
    return null;
  }
  return {
    type: extra.type,
    title: extra.title,
    body: extra.body,
    dedupKey: extra.dedupKey,
    taskId: extra.taskId,
  };
}
