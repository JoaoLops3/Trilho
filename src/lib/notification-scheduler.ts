import type { Task } from "../components/TaskCard";
import { dayKey } from "./day-stats";
import type { LeadMinutes } from "./notification-preferences";
import { taskDay } from "./week-utils";

export function parseScheduledMinutes(time?: string): number | null {
  if (!time) return null;
  const [hours, mins] = time
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function scheduledDateToday(
  time: string,
  now: Date = new Date(),
): Date | null {
  const scheduled = parseScheduledMinutes(time);
  if (scheduled === null) return null;
  const date = new Date(now);
  date.setHours(Math.floor(scheduled / 60), scheduled % 60, 0, 0);
  return date;
}

function isTaskForToday(task: Task, now: Date): boolean {
  return taskDay(task, dayKey(now)) === dayKey(now);
}

export function getUpcomingTaskReminders(
  tasks: Task[],
  now: Date = new Date(),
  leadMinutes: LeadMinutes = 10,
): Task[] {
  const nowMinutes = minutesOfDay(now);
  return tasks.filter((task) => {
    if (task.status !== "pending" && task.status !== "paused") return false;
    if (!isTaskForToday(task, now)) return false;
    const scheduled = parseScheduledMinutes(task.scheduledTime);
    if (scheduled === null) return false;
    return nowMinutes >= scheduled - leadMinutes && nowMinutes <= scheduled;
  });
}

export function getOverdueTasks(tasks: Task[], now: Date = new Date()): Task[] {
  const nowMinutes = minutesOfDay(now);
  return tasks.filter((task) => {
    if (task.status !== "pending") return false;
    if (!isTaskForToday(task, now)) return false;
    const scheduled = parseScheduledMinutes(task.scheduledTime);
    if (scheduled === null) return false;
    return nowMinutes > scheduled;
  });
}

export function getTimerFinishAt(
  task: Task,
  now: Date = new Date(),
): Date | null {
  if (task.status !== "active") return null;
  const remainingSeconds = task.duration - task.elapsed;
  if (remainingSeconds <= 0) return null;
  return new Date(now.getTime() + remainingSeconds * 1000);
}

const STREAK_RISK_HOUR = 20;

export function getStreakAtRiskScheduleAt(
  streak: number,
  completedToday: number,
  now: Date = new Date(),
): Date | null {
  if (streak <= 0 || completedToday > 0) return null;

  const scheduleAt = new Date(now);
  scheduleAt.setHours(STREAK_RISK_HOUR, 0, 0, 0);

  const minScheduleMs = now.getTime() + 5_000;
  if (scheduleAt.getTime() < minScheduleMs) return null;

  return scheduleAt;
}
