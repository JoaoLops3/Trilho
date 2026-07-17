import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RoutineTemplate, RoutineTemplateInput } from "../types/routine";
import { loadRoutines, saveRoutines } from "./routine-storage";
import { captureEvent } from "./posthog";
import { useAuth } from "./auth-context";
import { useSync } from "./sync-context";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fromInput(input: RoutineTemplateInput): RoutineTemplate {
  return {
    id: createId(),
    title: input.title,
    category: input.category,
    duration: input.duration,
    priority: input.priority,
    scheduledTime: input.scheduledTime,
    weekdays: input.weekdays,
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
  };
}

interface RoutinesContextValue {
  routines: RoutineTemplate[];
  createRoutine: (input: RoutineTemplateInput) => RoutineTemplate;
  updateRoutine: (id: string, input: RoutineTemplateInput) => void;
  setRoutineActive: (id: string, active: boolean) => void;
  deleteRoutine: (id: string) => void;
  /**
   * Cria vários templates de uma vez a partir de inputs sem id — contrato
   * consumido pelo onboarding de rotinas prontas (Fase 12).
   */
  applyRoutineTemplates: (inputs: RoutineTemplateInput[]) => RoutineTemplate[];
}

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function useRoutines(): RoutinesContextValue {
  const ctx = useContext(RoutinesContext);
  if (!ctx) {
    throw new Error("useRoutines deve ser usado dentro de um RoutinesProvider");
  }
  return ctx;
}

export function RoutinesProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<RoutineTemplate[]>(loadRoutines);
  const { isAuthenticated } = useAuth();
  const { registerSyncHandlers, scheduleRoutinesPush, isApplyingRemote } =
    useSync();

  useEffect(() => {
    registerSyncHandlers({
      applyRoutines: (next) => setRoutines(next),
    });
  }, [registerSyncHandlers]);

  useEffect(() => {
    saveRoutines(routines);
    if (isAuthenticated && !isApplyingRemote) {
      scheduleRoutinesPush(routines);
    }
  }, [routines, isAuthenticated, isApplyingRemote, scheduleRoutinesPush]);

  const createRoutine = useCallback((input: RoutineTemplateInput) => {
    const routine = fromInput(input);
    setRoutines((prev) => [...prev, routine]);
    captureEvent("routine created", {
      category: routine.category,
      weekday_count: routine.weekdays.length,
      has_time: Boolean(routine.scheduledTime),
    });
    return routine;
  }, []);

  const updateRoutine = useCallback(
    (id: string, input: RoutineTemplateInput) => {
      setRoutines((prev) =>
        prev.map((routine) =>
          routine.id === id
            ? {
                ...routine,
                title: input.title,
                category: input.category,
                duration: input.duration,
                priority: input.priority,
                scheduledTime: input.scheduledTime,
                weekdays: input.weekdays,
                active: input.active ?? routine.active,
              }
            : routine,
        ),
      );
    },
    [],
  );

  const setRoutineActive = useCallback((id: string, active: boolean) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id ? { ...routine, active } : routine,
      ),
    );
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setRoutines((prev) => prev.filter((routine) => routine.id !== id));
    captureEvent("routine deleted");
  }, []);

  const applyRoutineTemplates = useCallback(
    (inputs: RoutineTemplateInput[]) => {
      const created = inputs.map(fromInput);
      setRoutines((prev) => [...prev, ...created]);
      return created;
    },
    [],
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({
      routines,
      createRoutine,
      updateRoutine,
      setRoutineActive,
      deleteRoutine,
      applyRoutineTemplates,
    }),
    [
      routines,
      createRoutine,
      updateRoutine,
      setRoutineActive,
      deleteRoutine,
      applyRoutineTemplates,
    ],
  );

  return (
    <RoutinesContext.Provider value={value}>
      {children}
    </RoutinesContext.Provider>
  );
}
