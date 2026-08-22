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
import type { Task, TaskStatus } from "../types/task";
import { saveTasks } from "./storage";
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
import { captureEvent } from "./posthog";
import { taskAnalyticsProps } from "./analytics-task";
import { useAuth } from "./auth-context";
import { useRoutines } from "./routines-context";
import { useSync } from "./sync-context";
import { cancelTaskNotifications } from "./native-notifications";
import {
  applyCompletion,
  getInitialTasks,
  getWallClockElapsed,
  type ActiveSession,
} from "./tasks-domain-helpers";
import { useTaskAppLifecycle } from "./use-task-app-lifecycle";

export interface TasksDomainContextValue {
  tasks: Task[];
  streak: number;
  createTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  changeStatus: (id: string, status: TaskStatus) => void;
  /**
   * Tempo decorrido "ao vivo" de uma tarefa: para a tarefa ativa calcula a
   * partir do relógio de parede sem depender do estado persistido, evitando
   * re-renders globais a cada segundo.
   */
  getLiveElapsed: (task: Task) => number;
}

const TasksDomainContext = createContext<TasksDomainContextValue | null>(null);

export function useTasksDomain(): TasksDomainContextValue {
  const ctx = useContext(TasksDomainContext);
  if (!ctx) {
    throw new Error(
      "useTasksDomain deve ser usado dentro de um TasksDomainProvider",
    );
  }
  return ctx;
}

/**
 * Domínio de tarefas: estado, persistência, sync, timer e analytics.
 * Sheet UI e CapApp ficam em task-sheet-context / use-task-app-lifecycle.
 */
export function TasksDomainProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(getInitialTasks);
  const [streak, setStreak] = useState(() => computeStreak(loadHistory()));
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

  useTaskAppLifecycle({ flushActiveElapsed, runDayRollover });

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

  const createTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
    captureEvent("task created", taskAnalyticsProps(task));
  }, []);

  const updateTask = useCallback((task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    captureEvent("task edited", taskAnalyticsProps(task));
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

  const value = useMemo<TasksDomainContextValue>(
    () => ({
      tasks,
      streak,
      createTask,
      updateTask,
      deleteTask,
      changeStatus,
      getLiveElapsed,
    }),
    [
      tasks,
      streak,
      createTask,
      updateTask,
      deleteTask,
      changeStatus,
      getLiveElapsed,
    ],
  );

  return (
    <TasksDomainContext.Provider value={value}>
      {children}
    </TasksDomainContext.Provider>
  );
}
