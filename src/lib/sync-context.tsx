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
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { Task } from "../components/TaskCard";
import type { DayStat } from "./day-stats";
import { saveHistory } from "./day-stats";
import type { NotificationPreferences } from "./notification-preferences";
import { saveNotifications } from "./notification-storage";
import { savePreferences } from "./notification-preferences";
import { mergeDailyGoalMinutes } from "./daily-goal";
import { loadProfile, saveProfile } from "./profile-storage";
import { saveTasks } from "./storage";
import { saveRoutines } from "./routine-storage";
import type { UserProfile } from "../types/avatar";
import type { AppNotification } from "../types/notification";
import type { RoutineTemplate } from "../types/routine";
import { useAuth } from "./auth-context";
import { captureEvent } from "./posthog";
import {
  hasCloudData,
  markLocalImportDone,
  pullUserSnapshot,
  pushUserSnapshot,
  syncHistoryToCloud,
  syncNotificationsToCloud,
  syncPreferencesToCloud,
  syncProfileToCloud,
  syncRoutinesToCloud,
  syncTasksToCloud,
} from "./sync/cloud-sync";
import {
  EMPTY_SNAPSHOT,
  hasMeaningfulLocalData,
  readLocalSnapshot,
  type UserDataSnapshot,
} from "./sync/mappers";

const PUSH_DEBOUNCE_MS = 800;

export interface SyncHandlers {
  applyTasks?: (tasks: Task[]) => void;
  applyProfile?: (profile: UserProfile) => void;
  applyHistory?: (history: DayStat[]) => void;
  applyNotifications?: (notifications: AppNotification[]) => void;
  applyPreferences?: (preferences: NotificationPreferences) => void;
  applyRoutines?: (routines: RoutineTemplate[]) => void;
}

interface SyncContextValue {
  isSyncing: boolean;
  isApplyingRemote: boolean;
  importPromptOpen: boolean;
  /** True depois do first sync (ou se não há sessão). Evita decisões prematuras. */
  initialSyncComplete: boolean;
  registerSyncHandlers: (handlers: SyncHandlers) => void;
  scheduleTasksPush: (tasks: Task[]) => void;
  scheduleHistoryPush: (history: DayStat[]) => void;
  scheduleProfilePush: (profile: UserProfile) => void;
  pushProfileNow: (profile: UserProfile) => Promise<void>;
  schedulePreferencesPush: (preferences: NotificationPreferences) => void;
  scheduleNotificationsPush: (notifications: AppNotification[]) => void;
  scheduleRoutinesPush: (routines: RoutineTemplate[]) => void;
  resolveImport: (useLocalData: boolean) => Promise<void>;
  refreshFromCloud: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync deve ser usado dentro de um SyncProvider");
  }
  return ctx;
}

function persistSnapshotLocally(snapshot: UserDataSnapshot): void {
  saveTasks(snapshot.tasks);
  saveProfile(snapshot.profile);
  saveHistory(snapshot.history);
  savePreferences(snapshot.preferences);
  saveNotifications(snapshot.notifications);
  saveRoutines(snapshot.routines);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isApplyingRemote, setIsApplyingRemote] = useState(false);
  const [importPromptOpen, setImportPromptOpen] = useState(false);
  const [initialSyncComplete, setInitialSyncComplete] = useState(false);
  const isApplyingRemoteRef = useRef(false);
  const handlersRef = useRef<SyncHandlers>({});
  const pushTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const initialSyncDoneRef = useRef<string | null>(null);

  const registerSyncHandlers = useCallback((handlers: SyncHandlers) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
  }, []);

  const applySnapshot = useCallback((snapshot: UserDataSnapshot) => {
    isApplyingRemoteRef.current = true;
    setIsApplyingRemote(true);
    const local = loadProfile();
    const mergedProfile: UserProfile = {
      ...snapshot.profile,
      dailyGoalMinutes: mergeDailyGoalMinutes(
        local.dailyGoalMinutes,
        snapshot.profile.dailyGoalMinutes,
      ),
    };
    const mergedSnapshot = { ...snapshot, profile: mergedProfile };
    handlersRef.current.applyTasks?.(mergedSnapshot.tasks);
    handlersRef.current.applyProfile?.(mergedProfile);
    handlersRef.current.applyHistory?.(mergedSnapshot.history);
    handlersRef.current.applyNotifications?.(mergedSnapshot.notifications);
    handlersRef.current.applyPreferences?.(mergedSnapshot.preferences);
    handlersRef.current.applyRoutines?.(mergedSnapshot.routines);
    persistSnapshotLocally(mergedSnapshot);
    window.setTimeout(() => {
      isApplyingRemoteRef.current = false;
      setIsApplyingRemote(false);
    }, 0);
  }, []);

  const runInitialSync = useCallback(
    async (uid: string) => {
      setIsSyncing(true);
      try {
        const cloudExists = await hasCloudData(uid);
        const localExists = hasMeaningfulLocalData();

        if (!cloudExists && localExists) {
          setImportPromptOpen(true);
          return;
        }

        if (cloudExists) {
          const snapshot = await pullUserSnapshot(uid);
          applySnapshot(snapshot);
          if (!snapshot.localImportDone) {
            await markLocalImportDone(uid);
          }
          captureEvent("sync pulled from cloud");
        } else {
          await markLocalImportDone(uid);
        }
      } finally {
        setIsSyncing(false);
        setInitialSyncComplete(true);
      }
    },
    [applySnapshot],
  );

  const refreshFromCloud = useCallback(async () => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      const snapshot = await pullUserSnapshot(userId);
      applySnapshot(snapshot);
      captureEvent("sync refreshed from cloud");
    } finally {
      setIsSyncing(false);
    }
  }, [userId, applySnapshot]);

  const resolveImport = useCallback(
    async (useLocalData: boolean) => {
      if (!userId) return;
      setImportPromptOpen(false);
      setIsSyncing(true);
      try {
        if (useLocalData) {
          const snapshot = readLocalSnapshot();
          await pushUserSnapshot(userId, snapshot, true);
          captureEvent("sync imported local data");
        } else {
          applySnapshot(EMPTY_SNAPSHOT);
          await markLocalImportDone(userId);
          captureEvent("sync started fresh on cloud");
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [userId, applySnapshot],
  );

  const schedulePush = useCallback(
    (key: string, fn: () => Promise<void>) => {
      if (!userId || isApplyingRemoteRef.current) return;

      const existing = pushTimersRef.current[key];
      if (existing) clearTimeout(existing);

      pushTimersRef.current[key] = setTimeout(() => {
        void fn();
      }, PUSH_DEBOUNCE_MS);
    },
    [userId],
  );

  const scheduleTasksPush = useCallback(
    (tasks: Task[]) => {
      schedulePush("tasks", () => syncTasksToCloud(userId!, tasks));
    },
    [schedulePush, userId],
  );

  const scheduleHistoryPush = useCallback(
    (history: DayStat[]) => {
      schedulePush("history", () => syncHistoryToCloud(userId!, history));
    },
    [schedulePush, userId],
  );

  const scheduleProfilePush = useCallback(
    (profile: UserProfile) => {
      schedulePush("profile", () => syncProfileToCloud(userId!, profile));
    },
    [schedulePush, userId],
  );

  const pushProfileNow = useCallback(
    async (profile: UserProfile) => {
      if (!userId || isApplyingRemoteRef.current) return;
      const existing = pushTimersRef.current.profile;
      if (existing) clearTimeout(existing);
      await syncProfileToCloud(userId, profile);
    },
    [userId],
  );

  const schedulePreferencesPush = useCallback(
    (preferences: NotificationPreferences) => {
      schedulePush("preferences", () =>
        syncPreferencesToCloud(userId!, preferences),
      );
    },
    [schedulePush, userId],
  );

  const scheduleNotificationsPush = useCallback(
    (notifications: AppNotification[]) => {
      schedulePush("notifications", () =>
        syncNotificationsToCloud(userId!, notifications),
      );
    },
    [schedulePush, userId],
  );

  const scheduleRoutinesPush = useCallback(
    (routines: RoutineTemplate[]) => {
      schedulePush("routines", () => syncRoutinesToCloud(userId!, routines));
    },
    [schedulePush, userId],
  );

  useEffect(() => {
    if (authLoading) {
      setInitialSyncComplete(false);
      return;
    }

    if (!isAuthenticated || !userId) {
      initialSyncDoneRef.current = null;
      setImportPromptOpen(false);
      setInitialSyncComplete(true);
      return;
    }

    if (initialSyncDoneRef.current === userId) return;
    initialSyncDoneRef.current = userId;
    setInitialSyncComplete(false);
    void runInitialSync(userId);
  }, [authLoading, isAuthenticated, userId, runInitialSync]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    const listener = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive && !importPromptOpen) {
        void refreshFromCloud();
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [userId, importPromptOpen, refreshFromCloud]);

  useEffect(() => {
    return () => {
      Object.values(pushTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const value = useMemo<SyncContextValue>(
    () => ({
      isSyncing,
      isApplyingRemote,
      importPromptOpen,
      initialSyncComplete,
      registerSyncHandlers,
      scheduleTasksPush,
      scheduleHistoryPush,
      scheduleProfilePush,
      pushProfileNow,
      schedulePreferencesPush,
      scheduleNotificationsPush,
      scheduleRoutinesPush,
      resolveImport,
      refreshFromCloud,
    }),
    [
      isSyncing,
      isApplyingRemote,
      importPromptOpen,
      initialSyncComplete,
      registerSyncHandlers,
      scheduleTasksPush,
      scheduleHistoryPush,
      scheduleProfilePush,
      pushProfileNow,
      schedulePreferencesPush,
      scheduleNotificationsPush,
      scheduleRoutinesPush,
      resolveImport,
      refreshFromCloud,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
