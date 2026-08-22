import { useEffect, useState, type ReactNode } from "react";
import type { Task } from "../types/task";
import {
  TasksDomainProvider,
  useTasksDomain,
  type TasksDomainContextValue,
} from "./tasks-domain-context";
import { TaskSheetProvider, useTaskSheet } from "./task-sheet-context";

/**
 * API pública estável — composição de domínio + sheet UI.
 * Preferir useTasksDomain / useTaskSheet quando a tela só precisa de um lado.
 */
export type TasksContextValue = TasksDomainContextValue &
  ReturnType<typeof useTaskSheet>;

export function useTasks(): TasksContextValue {
  const domain = useTasksDomain();
  const sheet = useTaskSheet();
  return { ...domain, ...sheet };
}

export function useActiveElapsed(task: Task | null | undefined): number {
  const { getLiveElapsed } = useTasksDomain();
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

function TaskSheetBridge({ children }: { children: ReactNode }) {
  const { tasks, createTask, updateTask } = useTasksDomain();
  return (
    <TaskSheetProvider
      tasks={tasks}
      createTask={createTask}
      updateTask={updateTask}
    >
      {children}
    </TaskSheetProvider>
  );
}

/** Compositor: domínio → sheet. App.tsx continua importando só TasksProvider. */
export function TasksProvider({ children }: { children: ReactNode }) {
  return (
    <TasksDomainProvider>
      <TaskSheetBridge>{children}</TaskSheetBridge>
    </TasksDomainProvider>
  );
}

export { useTasksDomain } from "./tasks-domain-context";
export { useTaskSheet } from "./task-sheet-context";
