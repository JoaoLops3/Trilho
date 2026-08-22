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
import type { Task, TaskStatus } from "../types/task";
import { loadTasks, saveTasks } from "./storage";
import {
  computeFocusSeconds,
  computeStreak,
  computeTodayCompletedCount,
  dayKey,
  loadHistory,
  recordToday,
  saveHistory,
} from "./day-stats";
import { loadLastFocusDay, rolloverTasksIfNewDay } from "./day-rollover";
import { generateRoutineInstances } from "./routine-generator";
import { loadRoutines } from "./routine-storage";
import { captureEvent } from "./posthog";
import { taskAnalyticsProps } from "./analytics-task";
import { useAuth } from "./auth-context";
import { useRoutines } from "./routines-context";
import { useSync } from "./sync-context";
import {
  cancelTaskNotifications,
  checkNotificationPermission,
  requestNotificationPermission,
  syncNativeSchedulesFromStorage,
} from "./native-notifications";
import {
  hasSeenNotificationPermissionPrompt,
  markNotificationPermissionPromptSeen,
} from "./notification-permission-prompt";

interface ActiveSession {
  taskId: string;
  startedAtMs: number;
  elapsedAtStart: number;
}

function getWallClockElapsed(
  task: Task,
  session: ActiveSession | null,
): number {
  if (!session || session.taskId !== task.id || task.status !== "active") {
    return task.elapsed;
  }
  const delta = Math.floor((Date.now() - session.startedAtMs) / 1000);
  return Math.min(task.duration, session.elapsedAtStart + delta);
}

function getInitialTasks(): Task[] {
  const loaded = loadTasks() ?? [];
  return generateRoutineInstances(
    rolloverTasksIfNewDay(loaded),
    loadRoutines(),
  );
}

function applyCompletion(
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

interface TasksContextValue {
  tasks: Task[];
  streak: number;
  isNewTaskOpen: boolean;
  taskToEdit: Task | null;
  /** Dia pré-selecionado ao abrir o sheet de nova tarefa (Agenda). */
  createTaskDatePrefill: string | null;
  /** Agenda registra o dia selecionado para o botão + da tab bar herdar. */
  setCreateTaskDatePrefill: (day: string | null) => void;
  openNewTask: (options?: { scheduledDate?: string }) => void;
  editTask: (id: string) => void;
  closeTaskSheet: () => void;
  submitTask: (task: Task) => void;
  notificationPermissionPromptOpen: boolean;
  dismissNotificationPermissionPrompt: () => void;
  confirmNotificationPermissionPrompt: () => Promise<void>;
  deleteTask: (id: string) => void;
  changeStatus: (id: string, status: TaskStatus) => void;
  /**
   * Tempo decorrido "ao vivo" de uma tarefa: para a tarefa ativa calcula a
   * partir do relógio de parede sem depender do estado persistido, evitando
   * re-renders globais a cada segundo.
   */
  getLiveElapsed: (task: Task) => number;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks deve ser usado dentro de um TasksProvider");
  }
  return ctx;
}

export function useActiveElapsed(task: Task | null | undefined): number {
  const { getLiveElapsed } = useTasks();
  const [, setTick] = useState(0);
  const isActive = task?.status === "active";
  const taskId = task?.id;

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive, taskId]);

  return task ? getLiveElapsed(task) : 0;
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(getInitialTasks);
  const [streak, setStreak] = useState(() => computeStreak(loadHistory()));
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createTaskDatePrefill, setCreateTaskDatePrefill] = useState<
    string | null
  >(null);
  const [
    notificationPermissionPromptOpen,
    setNotificationPermissionPromptOpen,
  ] = useState(false);
  const { isAuthenticated } = useAuth();
  const { routines } = useRoutines();
  const routinesRef = useRef(routines);
  routinesRef.current = routines;
  const {
    registerSyncHandlers,
    scheduleTasksPush,
    scheduleHistoryPush,
    isApplyingRemote,
  } = useSync();

  useEffect(() => {
    registerSyncHandlers({
      applyTasks: (nextTasks) =>
        setTasks(
          generateRoutineInstances(
            rolloverTasksIfNewDay(nextTasks),
            routinesRef.current,
          ),
        ),
      applyHistory: (history) => {
        saveHistory(history);
        setStreak(computeStreak(history));
      },
    });
  }, [registerSyncHandlers]);

  // Reconcilia instâncias quando os templates mudam (criação/edição/exclusão/
  // ativação): gera a instância de hoje na hora e remove órfãs. Idempotente.
  useEffect(() => {
    setTasks((prev) => generateRoutineInstances(prev, routines));
  }, [routines]);

  const taskToEdit = editingTaskId
    ? (tasks.find((t) => t.id === editingTaskId) ?? null)
    : null;

  const activeTask = tasks.find((t) => t.status === "active");
  const focusSeconds = computeFocusSeconds(tasks);
  const completedCount = computeTodayCompletedCount(tasks);

  const completedRecordedRef = useRef<Set<string>>(
    new Set(
      getInitialTasks()
        .filter((t) => t.status === "completed")
        .map((t) => t.id),
    ),
  );

  const activeSessionRef = useRef<ActiveSession | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const editingTaskIdRef = useRef(editingTaskId);
  editingTaskIdRef.current = editingTaskId;

  const getLiveElapsed = useCallback(
    (task: Task) => getWallClockElapsed(task, activeSessionRef.current),
    [],
  );

  const runDayRollover = useCallback(() => {
    const today = dayKey();
    if (loadLastFocusDay() === today) return;

    setTasks((prev) => {
      let next = prev;
      const active = prev.find((t) => t.status === "active");
      if (active) {
        const flushed = getWallClockElapsed(active, activeSessionRef.current);
        next = prev.map((t) =>
          t.id === active.id ? { ...t, elapsed: flushed } : t,
        );
      }
      return generateRoutineInstances(
        rolloverTasksIfNewDay(next, today),
        routinesRef.current,
        today,
      );
    });

    if (activeSessionRef.current) {
      activeSessionRef.current = {
        ...activeSessionRef.current,
        startedAtMs: Date.now(),
        elapsedAtStart: 0,
      };
    }
  }, []);

  // Persiste o elapsed da tarefa ativa a partir do relógio de parede. Usado nas
  // transições de app (background/foreground), ao esconder a aba e na conclusão
  // automática — nunca a cada segundo.
  const flushActiveElapsed = useCallback(() => {
    setTasks((prev) => {
      const active = prev.find((t) => t.status === "active");
      if (!active) return prev;

      const newElapsed = getWallClockElapsed(active, activeSessionRef.current);
      if (newElapsed >= active.duration) {
        activeSessionRef.current = null;
        return prev.map((t) =>
          t.id === active.id
            ? applyCompletion(t, "completed", { elapsed: t.duration })
            : t,
        );
      }
      if (newElapsed === active.elapsed) return prev;
      return prev.map((t) =>
        t.id === active.id ? { ...t, elapsed: newElapsed } : t,
      );
    });
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener("appStateChange", ({ isActive }) => {
      flushActiveElapsed();
      if (isActive) runDayRollover();
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [flushActiveElapsed, runDayRollover]);

  useEffect(() => {
    if (!activeTask) {
      activeSessionRef.current = null;
      return;
    }

    if (activeSessionRef.current?.taskId !== activeTask.id) {
      activeSessionRef.current = {
        taskId: activeTask.id,
        startedAtMs: Date.now(),
        elapsedAtStart: activeTask.elapsed,
      };
    }
  }, [activeTask?.id]);

  useEffect(() => {
    const pruned = saveTasks(tasks);
    if (pruned.length !== tasks.length) {
      setTasks(pruned);
      return;
    }
    if (isAuthenticated && !isApplyingRemote) {
      scheduleTasksPush(pruned);
    }
  }, [tasks, isAuthenticated, isApplyingRemote, scheduleTasksPush]);

  useEffect(() => {
    if (!activeTask) return;

    const interval = setInterval(() => {
      const elapsed = getWallClockElapsed(activeTask, activeSessionRef.current);
      if (elapsed >= activeTask.duration) {
        flushActiveElapsed();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTask, flushActiveElapsed]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushActiveElapsed();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flushActiveElapsed);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flushActiveElapsed);
    };
  }, [flushActiveElapsed]);

  // Virada do dia: zera elapsed de tarefas não concluídas (foco diário).
  useEffect(() => {
    runDayRollover();

    const interval = setInterval(runDayRollover, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") runDayRollover();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runDayRollover]);

  useEffect(() => {
    const history = recordToday({
      tasksCompleted: completedCount,
      focusSeconds,
    });
    setStreak(computeStreak(history));
    if (isAuthenticated && !isApplyingRemote) {
      scheduleHistoryPush(history);
    }
  }, [
    completedCount,
    focusSeconds,
    isAuthenticated,
    isApplyingRemote,
    scheduleHistoryPush,
  ]);

  useEffect(() => {
    tasks.forEach((task) => {
      if (
        task.status === "completed" &&
        !completedRecordedRef.current.has(task.id)
      ) {
        completedRecordedRef.current.add(task.id);
        captureEvent(
          "task completed",
          taskAnalyticsProps(task, {
            completion_rate: Math.round((task.elapsed / task.duration) * 100),
          }),
        );
      }
    });
  }, [tasks]);

  const submitTask = useCallback((task: Task) => {
    const isEditing = editingTaskIdRef.current !== null;

    if (editingTaskIdRef.current) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      captureEvent("task edited", taskAnalyticsProps(task));
      return;
    }
    setTasks((prev) => [...prev, task]);
    captureEvent("task created", taskAnalyticsProps(task));

    if (
      task.scheduledTime &&
      !isEditing &&
      Capacitor.isNativePlatform() &&
      !hasSeenNotificationPermissionPrompt()
    ) {
      void checkNotificationPermission().then((permission) => {
        if (permission === "prompt") {
          setNotificationPermissionPromptOpen(true);
        }
      });
    }
  }, []);

  const dismissNotificationPermissionPrompt = useCallback(() => {
    markNotificationPermissionPromptSeen();
    setNotificationPermissionPromptOpen(false);
  }, []);

  const confirmNotificationPermissionPrompt = useCallback(async () => {
    markNotificationPermissionPromptSeen();
    setNotificationPermissionPromptOpen(false);
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      void syncNativeSchedulesFromStorage(tasksRef.current);
    }
  }, []);

  const openNewTask = useCallback((options?: { scheduledDate?: string }) => {
    setEditingTaskId(null);
    if (options?.scheduledDate) {
      setCreateTaskDatePrefill(options.scheduledDate);
    }
    setIsNewTaskOpen(true);
  }, []);

  const editTask = useCallback((id: string) => {
    setEditingTaskId(id);
    setIsNewTaskOpen(true);
  }, []);

  const closeTaskSheet = useCallback(() => {
    setIsNewTaskOpen(false);
    setEditingTaskId(null);
  }, []);

  const deleteTask = useCallback((id: string) => {
    const target = tasksRef.current.find((t) => t.id === id);
    completedRecordedRef.current.delete(id);
    void cancelTaskNotifications(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (target) {
      captureEvent(
        "task deleted",
        taskAnalyticsProps(target, { task_status: target.status }),
      );
    }
  }, []);

  const changeStatus = useCallback((id: string, newStatus: TaskStatus) => {
    const task = tasksRef.current.find((t) => t.id === id);
    const leavingActive = task?.status === "active" && newStatus !== "active";
    const flushedElapsed = leavingActive
      ? getWallClockElapsed(task!, activeSessionRef.current)
      : undefined;

    if (newStatus === "paused" && task?.status === "active") {
      void cancelTaskNotifications(id);
    }

    if (newStatus === "completed") {
      void cancelTaskNotifications(id);
    }

    if (newStatus === "active") {
      activeSessionRef.current = {
        taskId: id,
        startedAtMs: Date.now(),
        elapsedAtStart: task?.elapsed ?? 0,
      };
    } else if (activeSessionRef.current?.taskId === id) {
      activeSessionRef.current = null;
    }

    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        if (flushedElapsed !== undefined) {
          return applyCompletion(t, newStatus, { elapsed: flushedElapsed });
        }
        return applyCompletion(t, newStatus);
      });

      if (newStatus === "active") {
        return updated.map((t) =>
          t.id === id
            ? t
            : t.status === "active"
              ? { ...t, status: "paused" }
              : t,
        );
      }
      return updated;
    });
  }, []);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      streak,
      isNewTaskOpen,
      taskToEdit,
      createTaskDatePrefill,
      setCreateTaskDatePrefill,
      openNewTask,
      editTask,
      closeTaskSheet,
      submitTask,
      notificationPermissionPromptOpen,
      dismissNotificationPermissionPrompt,
      confirmNotificationPermissionPrompt,
      deleteTask,
      changeStatus,
      getLiveElapsed,
    }),
    [
      tasks,
      streak,
      isNewTaskOpen,
      taskToEdit,
      createTaskDatePrefill,
      openNewTask,
      editTask,
      closeTaskSheet,
      submitTask,
      notificationPermissionPromptOpen,
      dismissNotificationPermissionPrompt,
      confirmNotificationPermissionPrompt,
      deleteTask,
      changeStatus,
      getLiveElapsed,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}
