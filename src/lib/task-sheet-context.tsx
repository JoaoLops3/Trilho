import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import type { Task } from "../types/task";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  syncNativeSchedulesFromStorage,
} from "./native-notifications";
import {
  hasSeenNotificationPermissionPrompt,
  markNotificationPermissionPromptSeen,
} from "./notification-permission-prompt";
import { useTasksDomain } from "./tasks-domain-context";

interface TaskSheetContextValue {
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
}

const TaskSheetContext = createContext<TaskSheetContextValue | null>(null);

export function useTaskSheet(): TaskSheetContextValue {
  const ctx = useContext(TaskSheetContext);
  if (!ctx) {
    throw new Error(
      "useTaskSheet deve ser usado dentro de um TaskSheetProvider",
    );
  }
  return ctx;
}

/**
 * Estado de UI do NewTaskSheet + prompt de permissão de notificação.
 * Mutações de dados ficam no TasksDomainProvider.
 */
export function TaskSheetProvider({ children }: { children: ReactNode }) {
  const { tasks, createTask, updateTask } = useTasksDomain();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createTaskDatePrefill, setCreateTaskDatePrefill] = useState<
    string | null
  >(null);
  const [
    notificationPermissionPromptOpen,
    setNotificationPermissionPromptOpen,
  ] = useState(false);

  const taskToEdit = editingTaskId
    ? (tasks.find((t: Task) => t.id === editingTaskId) ?? null)
    : null;

  const maybePromptNotificationPermission = useCallback((task: Task) => {
    if (
      !task.scheduledTime ||
      !Capacitor.isNativePlatform() ||
      hasSeenNotificationPermissionPrompt()
    ) {
      return;
    }
    void checkNotificationPermission().then((permission) => {
      if (permission === "prompt") {
        setNotificationPermissionPromptOpen(true);
      }
    });
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

  const submitTask = useCallback(
    (task: Task) => {
      if (editingTaskId) {
        updateTask(task);
      } else {
        createTask(task);
        maybePromptNotificationPermission(task);
      }
    },
    [editingTaskId, updateTask, createTask, maybePromptNotificationPermission],
  );

  const dismissNotificationPermissionPrompt = useCallback(() => {
    markNotificationPermissionPromptSeen();
    setNotificationPermissionPromptOpen(false);
  }, []);

  const confirmNotificationPermissionPrompt = useCallback(async () => {
    markNotificationPermissionPromptSeen();
    setNotificationPermissionPromptOpen(false);
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      void syncNativeSchedulesFromStorage(tasks);
    }
  }, [tasks]);

  const value = useMemo<TaskSheetContextValue>(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <TaskSheetContext.Provider value={value}>
      {children}
    </TaskSheetContext.Provider>
  );
}
