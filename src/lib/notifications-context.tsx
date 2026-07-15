import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppNotification } from "../types/notification";
import {
  buildDailyGoalCopy,
  buildStreakAtRiskCopy,
  buildStreakMilestoneCopy,
  buildTaskCompletedEntry,
  buildTaskOverdueEntry,
  buildTaskUpcomingEntry,
  buildTimerFinishedEntry,
  dailyGoalDedupKey,
  streakAtRiskDedupKey,
  streakMilestoneDedupKey,
} from "./notification-copy";
import {
  addNotification,
  loadNotifications,
  markAllAsRead as markAllReadStore,
  markAsRead as markReadStore,
  saveNotifications,
  type NewNotification,
} from "./notification-storage";
import { computeFocusSeconds } from "./day-stats";
import {
  getOverdueTasks,
  getUpcomingTaskReminders,
} from "./notification-scheduler";
import {
  loadPreferences,
  savePreferences,
  type NotificationPreferences,
} from "./notification-preferences";
import { syncNativeSchedules } from "./native-notifications";
import { useTasks } from "./tasks-context";
import { useProfile } from "./profile-context";
import { useAuth } from "./auth-context";
import { useSync } from "./sync-context";

const POLL_INTERVAL_MS = 60_000;
const STREAK_MILESTONES = [3, 7, 14, 30];
const STREAK_RISK_HOUR = 20;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  updatePreferences: (prefs: NotificationPreferences) => void;
  pushFromNative: (entry: NewNotification) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications deve ser usado dentro de um NotificationsProvider",
    );
  }
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { tasks, streak } = useTasks();
  const { profile } = useProfile();
  const { isAuthenticated } = useAuth();
  const {
    registerSyncHandlers,
    scheduleNotificationsPush,
    schedulePreferencesPush,
    isApplyingRemote,
  } = useSync();
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadNotifications(),
  );
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    loadPreferences(),
  );

  useEffect(() => {
    registerSyncHandlers({
      applyNotifications: (next) => setNotifications(next),
      applyPreferences: (next) => setPreferences(next),
    });
  }, [registerSyncHandlers]);

  const tasksRef = useRef(tasks);
  const streakRef = useRef(streak);
  const preferencesRef = useRef(preferences);
  const dailyGoalMinutesRef = useRef(profile.dailyGoalMinutes);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  useEffect(() => {
    dailyGoalMinutesRef.current = profile.dailyGoalMinutes;
  }, [profile.dailyGoalMinutes]);

  const knownCompletedRef = useRef<Set<string>>(
    new Set(tasks.filter((t) => t.status === "completed").map((t) => t.id)),
  );

  const knownTimerFinishedRef = useRef<Set<string>>(
    new Set(
      tasks
        .filter((t) => t.status === "active" && t.elapsed >= t.duration)
        .map((t) => t.id),
    ),
  );

  const timerCompletedViaTimerRef = useRef<Set<string>>(
    new Set(
      loadNotifications()
        .filter((n) => n.type === "timer_finished" && n.taskId)
        .map((n) => n.taskId!),
    ),
  );

  useEffect(() => {
    saveNotifications(notifications);
    if (isAuthenticated && !isApplyingRemote) {
      scheduleNotificationsPush(notifications);
    }
  }, [
    notifications,
    isAuthenticated,
    isApplyingRemote,
    scheduleNotificationsPush,
  ]);

  const push = useCallback((entry: NewNotification) => {
    if (!preferencesRef.current.enabled[entry.type]) return;
    setNotifications((prev) => addNotification(prev, entry));
  }, []);

  const pushFromNative = useCallback(
    (entry: NewNotification) => {
      if (entry.type === "timer_finished" && entry.taskId) {
        timerCompletedViaTimerRef.current.add(entry.taskId);
      }
      push(entry);
    },
    [push],
  );

  const runGeneration = useCallback(() => {
    const now = new Date();
    const currentTasks = tasksRef.current;
    const currentStreak = streakRef.current;
    const prefs = preferencesRef.current;
    const copyOptions = { hideTaskContent: prefs.hideTaskContent };

    if (prefs.enabled.task_upcoming) {
      getUpcomingTaskReminders(currentTasks, now, prefs.leadMinutes).forEach(
        (task) => push(buildTaskUpcomingEntry(task, now, copyOptions)),
      );
    }

    if (prefs.enabled.task_overdue) {
      getOverdueTasks(currentTasks, now).forEach((task) =>
        push(buildTaskOverdueEntry(task, now, copyOptions)),
      );
    }

    if (prefs.enabled.daily_goal_reached) {
      const focusMinutes = Math.floor(computeFocusSeconds(currentTasks) / 60);
      const dailyGoalMinutes = dailyGoalMinutesRef.current;
      if (focusMinutes >= dailyGoalMinutes) {
        const goalHours = Math.round(dailyGoalMinutes / 60);
        const copy = buildDailyGoalCopy(goalHours);
        push({
          type: "daily_goal_reached",
          ...copy,
          dedupKey: dailyGoalDedupKey(now),
        });
      }
    }

    if (prefs.enabled.streak_milestone) {
      if (STREAK_MILESTONES.includes(currentStreak)) {
        const copy = buildStreakMilestoneCopy(currentStreak);
        push({
          type: "streak_milestone",
          ...copy,
          dedupKey: streakMilestoneDedupKey(currentStreak),
        });
      }
    }

    if (prefs.enabled.streak_at_risk) {
      const completedToday = currentTasks.filter(
        (t) => t.status === "completed",
      ).length;
      if (
        now.getHours() >= STREAK_RISK_HOUR &&
        currentStreak > 0 &&
        completedToday === 0
      ) {
        const copy = buildStreakAtRiskCopy(currentStreak);
        push({
          type: "streak_at_risk",
          ...copy,
          dedupKey: streakAtRiskDedupKey(now),
        });
      }
    }
  }, [push]);

  useEffect(() => {
    tasks.forEach((task) => {
      if (
        task.status === "completed" &&
        !knownCompletedRef.current.has(task.id)
      ) {
        knownCompletedRef.current.add(task.id);
        if (timerCompletedViaTimerRef.current.has(task.id)) return;
        push(
          buildTaskCompletedEntry(task, {
            hideTaskContent: preferencesRef.current.hideTaskContent,
          }),
        );
      }
    });
  }, [tasks, push]);

  useEffect(() => {
    if (!preferences.enabled.timer_finished) return;
    tasks.forEach((task) => {
      if (
        task.status === "active" &&
        task.elapsed >= task.duration &&
        !knownTimerFinishedRef.current.has(task.id)
      ) {
        knownTimerFinishedRef.current.add(task.id);
        timerCompletedViaTimerRef.current.add(task.id);
        push(
          buildTimerFinishedEntry(task, {
            hideTaskContent: preferencesRef.current.hideTaskContent,
          }),
        );
      }
    });
  }, [tasks, push, preferences.enabled.timer_finished]);

  useEffect(() => {
    runGeneration();
    const interval = setInterval(runGeneration, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [runGeneration]);

  useEffect(() => {
    runGeneration();
  }, [streak, preferences, profile.dailyGoalMinutes, runGeneration]);

  useEffect(() => {
    void syncNativeSchedules(tasks, preferences);
  }, [tasks, preferences]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => markReadStore(prev, id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => markAllReadStore(prev));
  }, []);

  const updatePreferences = useCallback(
    (prefs: NotificationPreferences) => {
      setPreferences(prefs);
      savePreferences(prefs);
      void syncNativeSchedules(tasksRef.current, prefs);
      if (isAuthenticated && !isApplyingRemote) {
        schedulePreferencesPush(prefs);
      }
    },
    [isAuthenticated, isApplyingRemote, schedulePreferencesPush],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      preferences,
      markAsRead,
      markAllAsRead,
      updatePreferences,
      pushFromNative,
    }),
    [
      notifications,
      unreadCount,
      preferences,
      markAsRead,
      markAllAsRead,
      updatePreferences,
      pushFromNative,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
