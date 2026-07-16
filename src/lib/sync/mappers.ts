import type { Task } from "../../components/TaskCard";
import type { DayStat } from "../day-stats";
import { loadHistory } from "../day-stats";
import { loadNotifications } from "../notification-storage";
import { loadPreferences } from "../notification-preferences";
import { DEFAULT_ACCOUNT_NAME, loadProfile } from "../profile-storage";
import { loadTasks } from "../storage";
import type { AvatarStyle, UserProfile } from "../../types/avatar";
import { DEFAULT_DAILY_GOAL_MINUTES } from "../daily-goal";
import type { AppNotification } from "../../types/notification";
import type {
  DayHistoryRow,
  NotificationRow,
  ProfileRow,
  TaskRow,
} from "../../types/database";
import type { Database } from "../../types/database";
import type { NotificationPreferences } from "../notification-preferences";

export interface UserDataSnapshot {
  tasks: Task[];
  history: DayStat[];
  profile: UserProfile;
  preferences: NotificationPreferences;
  notifications: AppNotification[];
  localImportDone: boolean;
}

export function taskToRow(
  task: Task,
  userId: string,
): Database["public"]["Tables"]["tasks"]["Insert"] {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    category: task.category,
    duration: task.duration,
    elapsed: task.elapsed,
    status: task.status,
    priority: task.priority,
    scheduled_time: task.scheduledTime ?? null,
    completed_at: task.completedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    duration: row.duration,
    elapsed: row.elapsed,
    status: row.status,
    priority: row.priority,
    scheduledTime: row.scheduled_time ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export function profileToEditableRow(
  profile: UserProfile,
  localImportDone: boolean,
): Database["public"]["Tables"]["profiles"]["Update"] {
  return {
    // Guarda contra string vazia: o check do DB exige 2–50 chars e uma
    // violação derrubaria o update inteiro do perfil.
    display_name: profile.accountName.trim() || DEFAULT_ACCOUNT_NAME,
    nickname: profile.nickname,
    avatar_seed: profile.avatarSeed,
    avatar_style: profile.avatarStyle,
    daily_goal_minutes: profile.dailyGoalMinutes,
    local_import_done: localImportDone,
  };
}

export function profileToRow(
  profile: UserProfile,
  userId: string,
  localImportDone: boolean,
): Database["public"]["Tables"]["profiles"]["Insert"] {
  return {
    id: userId,
    display_name: profile.accountName,
    nickname: profile.nickname,
    avatar_seed: profile.avatarSeed,
    avatar_style: profile.avatarStyle,
    daily_goal_minutes: profile.dailyGoalMinutes,
    local_import_done: localImportDone,
  };
}

const KNOWN_AVATAR_STYLES: AvatarStyle[] = ["toon-head"];

/** Valida o valor vindo do banco; desconhecido/legado cai no fallback. */
function toAvatarStyle(value: string): AvatarStyle {
  return (KNOWN_AVATAR_STYLES as string[]).includes(value)
    ? (value as AvatarStyle)
    : "toon-head";
}

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    accountName: row.display_name,
    nickname: row.nickname,
    avatarSeed: row.avatar_seed,
    avatarStyle: toAvatarStyle(row.avatar_style),
    dailyGoalMinutes: row.daily_goal_minutes ?? DEFAULT_DAILY_GOAL_MINUTES,
  };
}

export function dayStatToRow(stat: DayStat, userId: string): DayHistoryRow {
  return {
    user_id: userId,
    date: stat.date,
    tasks_completed: stat.tasksCompleted,
    focus_seconds: stat.focusSeconds,
  };
}

export function rowToDayStat(row: DayHistoryRow): DayStat {
  return {
    date: row.date,
    tasksCompleted: row.tasks_completed,
    focusSeconds: row.focus_seconds,
  };
}

export function notificationToRow(
  notification: AppNotification,
  userId: string,
): NotificationRow {
  return {
    id: notification.id,
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    created_at: notification.createdAt,
    read: notification.read,
    dedup_key: notification.dedupKey,
    task_id: notification.taskId ?? null,
  };
}

export function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: row.read,
    dedupKey: row.dedup_key,
    taskId: row.task_id ?? undefined,
  };
}

export function readLocalSnapshot(): UserDataSnapshot {
  return {
    tasks: loadTasks() ?? [],
    history: loadHistory(),
    profile: loadProfile(),
    preferences: loadPreferences(),
    notifications: loadNotifications(),
    localImportDone: false,
  };
}

export function hasMeaningfulLocalData(): boolean {
  const snapshot = readLocalSnapshot();
  if (snapshot.tasks.length > 0) return true;
  if (snapshot.history.length > 0) return true;
  if (snapshot.notifications.length > 0) return true;
  if (snapshot.profile.avatarSeed) return true;
  if (snapshot.profile.nickname) return true;
  if (snapshot.profile.accountName !== "Alex") return true;
  return false;
}

export const EMPTY_SNAPSHOT: UserDataSnapshot = {
  tasks: [],
  history: [],
  profile: {
    accountName: "Alex",
    nickname: null,
    avatarSeed: null,
    avatarStyle: "toon-head",
    dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
  },
  preferences: readLocalSnapshot().preferences,
  notifications: [],
  localImportDone: true,
};
