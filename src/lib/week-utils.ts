import type { Task } from "../types/task";
import { dayKey } from "./day-stats";

/** Labels curtos indexados por `Date.getDay()`: 0=dom … 6=sáb. */
export const WEEKDAY_SHORT_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

const MONTH_SHORT_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

function parseDayKey(day: string): Date {
  return new Date(`${day}T00:00:00`);
}

/** Segunda-feira da semana que contém `date` (weekStartsOn=1, padrão BR). */
export function startOfWeek(
  date: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

/** 7 dayKeys (YYYY-MM-DD) a partir da segunda da semana de `anchor`. */
export function getWeekDays(anchor: Date = new Date()): string[] {
  const start = startOfWeek(anchor, 1);
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(dayKey(d));
  }
  return days;
}

export function addWeeks(anchor: Date, n: number): Date {
  const result = new Date(anchor);
  result.setDate(result.getDate() + n * 7);
  return result;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/**
 * Dia em que a task deve aparecer na agenda.
 * scheduledDate (avulsa) > routineDate (instância) > hoje (legado).
 */
export function taskDay(task: Task, today: string = dayKey()): string {
  return task.scheduledDate ?? task.routineDate ?? today;
}

/** Ex.: "13–19 jul" ou "28 jul–3 ago". */
export function formatWeekLabel(anchor: Date = new Date()): string {
  const days = getWeekDays(anchor);
  const start = parseDayKey(days[0]);
  const end = parseDayKey(days[6]);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_SHORT_PT[start.getMonth()];
  const endMonth = MONTH_SHORT_PT[end.getMonth()];

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

export function dayNumber(day: string): number {
  return parseDayKey(day).getDate();
}

export function weekdayShortLabel(day: string): string {
  return WEEKDAY_SHORT_LABELS[parseDayKey(day).getDay()];
}
