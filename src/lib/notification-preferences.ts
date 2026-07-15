import type { NotificationType } from "../types/notification";
import { STORAGE_KEYS } from "./storage-keys";

export type LeadMinutes = 5 | 10 | 15;

export interface NotificationPreferences {
  leadMinutes: LeadMinutes;
  hideTaskContent: boolean;
  enabled: Record<NotificationType, boolean>;
}

const STORAGE_KEY = STORAGE_KEYS.notificationPreferences;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_upcoming: "Lembrete de tarefa agendada",
  task_completed: "Tarefa concluída",
  daily_goal_reached: "Meta diária atingida",
  streak_milestone: "Marco de sequência",
  streak_at_risk: "Sequência em risco",
  task_overdue: "Tarefa atrasada",
  timer_finished: "Timer finalizado",
};

/** Tipos que disparam push nativo com app fechado ou em background. */
export const PUSH_NOTIFICATION_TYPES: NotificationType[] = [
  "task_upcoming",
  "task_overdue",
  "timer_finished",
  "streak_at_risk",
];

/** Tipos que aparecem na central in-app (com app aberto). */
export const INBOX_NOTIFICATION_TYPES: NotificationType[] = [
  "task_completed",
  "daily_goal_reached",
  "streak_milestone",
];

export const NOTIFICATION_TYPE_HINTS: Partial<
  Record<NotificationType, string>
> = {
  task_upcoming: "Celular — antes do horário agendado",
  task_overdue: "Celular — quando passa do horário sem iniciar",
  timer_finished: "Celular — quando o timer de foco termina",
  streak_at_risk: "Celular — à noite, se a sequência estiver em risco",
  task_completed: "Central in-app",
  daily_goal_reached: "Central in-app",
  streak_milestone: "Central in-app",
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  leadMinutes: 10,
  hideTaskContent: false,
  enabled: {
    task_upcoming: true,
    task_completed: true,
    daily_goal_reached: true,
    streak_milestone: true,
    streak_at_risk: true,
    task_overdue: true,
    timer_finished: true,
  },
};

function isLeadMinutes(value: unknown): value is LeadMinutes {
  return value === 5 || value === 10 || value === 15;
}

export function loadPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      leadMinutes: isLeadMinutes(parsed.leadMinutes)
        ? parsed.leadMinutes
        : DEFAULT_PREFERENCES.leadMinutes,
      hideTaskContent:
        typeof parsed.hideTaskContent === "boolean"
          ? parsed.hideTaskContent
          : DEFAULT_PREFERENCES.hideTaskContent,
      enabled: {
        ...DEFAULT_PREFERENCES.enabled,
        ...(parsed.enabled ?? {}),
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage indisponível: ignora silenciosamente.
  }
}
