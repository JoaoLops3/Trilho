import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type PermissionStatus,
} from "@capacitor/local-notifications";
import {
  AndroidSettings,
  IOSSettings,
  NativeSettings,
} from "capacitor-native-settings";
import type { Task } from "../types/task";
import type { NotificationType } from "../types/notification";
import {
  allNativeIdsForTask,
  isTimerFinishedNotificationId,
  nativeNotificationId,
  nativeStreakAtRiskNotificationId,
  NATIVE_NOTIFICATION_ID_MAX,
} from "./notification-native-ids";
import type { NotificationPreferences } from "./notification-preferences";
import { loadPreferences } from "./notification-preferences";
import {
  buildStreakAtRiskCopy,
  buildTaskOverdueCopy,
  buildTaskUpcomingCopy,
  buildTimerFinishedCopy,
  extraToInboxEntry,
  parseNativeNotificationExtra,
  streakAtRiskDedupKey,
  taskOverdueDedupKey,
  taskUpcomingDedupKey,
  timerFinishedDedupKey,
} from "./notification-copy";
import type { NewNotification } from "./notification-storage";
import { loadNotifications } from "./notification-storage";
import { computeStreak, dayKey, loadHistory } from "./day-stats";
import {
  getStreakAtRiskScheduleAt,
  getTimerFinishAt,
  scheduledDateToday,
} from "./notification-scheduler";
import { taskDay } from "./week-utils";

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported";

interface NativeNotificationPayload {
  id: number;
  title: string;
  body: string;
  scheduleAt: Date;
  extra: {
    type: NotificationType;
    taskId?: string;
    dedupKey: string;
    title: string;
    body: string;
  };
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function mapPermissionStatus(
  status: PermissionStatus,
): NotificationPermissionState {
  if (status.display === "granted") return "granted";
  if (status.display === "denied") return "denied";
  return "prompt";
}

export async function checkNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNative()) return "unsupported";
  try {
    const status = await LocalNotifications.checkPermissions();
    return mapPermissionStatus(status);
  } catch {
    return "unsupported";
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNative()) return "unsupported";
  try {
    const status = await LocalNotifications.requestPermissions();
    return mapPermissionStatus(status);
  } catch {
    return "unsupported";
  }
}

export async function openSystemNotificationSettings(): Promise<void> {
  if (!isNative()) return;
  try {
    await NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
    });
  } catch {
    // Falha ao abrir configurações: usuário pode abrir manualmente.
  }
}

export async function cancelTaskNotifications(
  taskId: string,
  date: Date = new Date(),
): Promise<void> {
  if (!isNative()) return;
  try {
    const ids = allNativeIdsForTask(taskId, date);
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  } catch {
    // Plugin indisponível: ignora.
  }
}

function buildNativePayloads(
  tasks: Task[],
  prefs: NotificationPreferences,
  now: Date,
  inboxDedupKeys: Set<string>,
): NativeNotificationPayload[] {
  const payloads: NativeNotificationPayload[] = [];
  const minScheduleMs = now.getTime() + 5_000;
  const copyOptions = { hideTaskContent: prefs.hideTaskContent };

  const today = dayKey(now);

  for (const task of tasks) {
    if (taskDay(task, today) !== today) continue;

    if (
      task.scheduledTime &&
      (task.status === "pending" || task.status === "paused") &&
      prefs.enabled.task_upcoming
    ) {
      const scheduled = scheduledDateToday(task.scheduledTime, now);
      if (scheduled) {
        const upcomingAt = new Date(
          scheduled.getTime() - prefs.leadMinutes * 60_000,
        );
        if (upcomingAt.getTime() >= minScheduleMs) {
          const copy = buildTaskUpcomingCopy(task, copyOptions);
          payloads.push({
            id: nativeNotificationId("task_upcoming", task.id, now),
            title: copy.title,
            body: copy.body,
            scheduleAt: upcomingAt,
            extra: {
              type: "task_upcoming",
              taskId: task.id,
              dedupKey: taskUpcomingDedupKey(task.id, now),
              title: copy.title,
              body: copy.body,
            },
          });
        }
      }
    }

    if (
      task.scheduledTime &&
      task.status === "pending" &&
      prefs.enabled.task_overdue
    ) {
      const scheduled = scheduledDateToday(task.scheduledTime, now);
      if (scheduled) {
        const overdueDedupKey = taskOverdueDedupKey(task.id, now);
        if (inboxDedupKeys.has(overdueDedupKey)) {
          continue;
        }
        const overdueAt =
          scheduled.getTime() >= minScheduleMs
            ? scheduled
            : new Date(minScheduleMs);
        const copy = buildTaskOverdueCopy(task, copyOptions);
        payloads.push({
          id: nativeNotificationId("task_overdue", task.id, now),
          title: copy.title,
          body: copy.body,
          scheduleAt: overdueAt,
          extra: {
            type: "task_overdue",
            taskId: task.id,
            dedupKey: taskOverdueDedupKey(task.id, now),
            title: copy.title,
            body: copy.body,
          },
        });
      }
    }

    if (task.status === "active" && prefs.enabled.timer_finished) {
      const finishAt = getTimerFinishAt(task, now);
      if (finishAt && finishAt.getTime() >= minScheduleMs) {
        const copy = buildTimerFinishedCopy(task, copyOptions);
        payloads.push({
          id: nativeNotificationId("timer_finished", task.id, now),
          title: copy.title,
          body: copy.body,
          scheduleAt: finishAt,
          extra: {
            type: "timer_finished",
            taskId: task.id,
            dedupKey: timerFinishedDedupKey(task.id),
            title: copy.title,
            body: copy.body,
          },
        });
      }
    }
  }

  if (prefs.enabled.streak_at_risk) {
    const streak = computeStreak(loadHistory(), dayKey(now));
    const completedToday = tasks.filter((t) => t.status === "completed").length;
    const scheduleAt = getStreakAtRiskScheduleAt(streak, completedToday, now);
    if (scheduleAt) {
      const copy = buildStreakAtRiskCopy(streak);
      payloads.push({
        id: nativeStreakAtRiskNotificationId(now),
        title: copy.title,
        body: copy.body,
        scheduleAt,
        extra: {
          type: "streak_at_risk",
          dedupKey: streakAtRiskDedupKey(now),
          title: copy.title,
          body: copy.body,
        },
      });
    }
  }

  return payloads;
}

export async function syncNativeSchedules(
  tasks: Task[],
  prefs: NotificationPreferences,
  now: Date = new Date(),
): Promise<void> {
  if (!isNative()) return;

  const permission = await checkNotificationPermission();
  if (permission !== "granted") return;

  try {
    const inboxDedupKeys = new Set(
      loadNotifications().map((notification) => notification.dedupKey),
    );
    const desired = buildNativePayloads(tasks, prefs, now, inboxDedupKeys);
    const desiredIds = new Set(desired.map((item) => item.id));

    const pending = await LocalNotifications.getPending();
    const staleIds = pending.notifications
      .map((notification) => ({
        id: notification.id,
        scheduleAt: notification.schedule?.at
          ? new Date(notification.schedule.at)
          : null,
      }))
      .filter(({ id, scheduleAt }) => {
        if (id < 1_000_000 || id >= NATIVE_NOTIFICATION_ID_MAX) return false;
        if (desiredIds.has(id)) return false;
        // Não cancelar timer_finished prestes a disparar (app em background).
        if (
          isTimerFinishedNotificationId(id) &&
          scheduleAt &&
          scheduleAt.getTime() - now.getTime() <= 120_000
        ) {
          return false;
        }
        return true;
      })
      .map(({ id }) => id);

    if (staleIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: staleIds.map((id) => ({ id })),
      });
    }

    if (desired.length === 0) return;

    await LocalNotifications.schedule({
      notifications: desired.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        schedule: {
          at: item.scheduleAt,
          allowWhileIdle: true,
        },
        extra: item.extra,
      })),
    });
  } catch {
    // Falha ao agendar: inbox in-app continua funcionando.
  }
}

export async function syncDeliveredNotificationsToInbox(
  onPush: (entry: NewNotification) => void,
): Promise<void> {
  if (!isNative()) return;

  const permission = await checkNotificationPermission();
  if (permission !== "granted") return;

  try {
    const { notifications } =
      await LocalNotifications.getDeliveredNotifications();
    for (const notification of notifications) {
      const entry = extraToInboxEntry(
        parseNativeNotificationExtra(notification.extra),
      );
      if (entry) onPush(entry);
    }
    if (notifications.length > 0) {
      await LocalNotifications.removeDeliveredNotifications({ notifications });
    }
  } catch {
    // Falha ao ler entregues: inbox segue com o que já tem.
  }
}

export async function syncNativeSchedulesFromStorage(
  tasks: Task[],
  now: Date = new Date(),
): Promise<void> {
  await syncNativeSchedules(tasks, loadPreferences(), now);
}
