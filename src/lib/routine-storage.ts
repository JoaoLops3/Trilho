import type { RoutineTemplate } from "../types/routine";

import { routineTemplateSchema } from "./storage-schemas";
import { parseStorageArray } from "./storage-runtime";
import { STORAGE_KEYS } from "./storage-keys";

const ROUTINES_KEY = STORAGE_KEYS.routines;

export function loadRoutines(): RoutineTemplate[] {
  try {
    return (
      parseStorageArray(
        localStorage.getItem(ROUTINES_KEY),
        routineTemplateSchema,
        { storageKey: ROUTINES_KEY, operation: "load_routines" },
      ) ?? []
    );
  } catch {
    return [];
  }
}

export function saveRoutines(routines: RoutineTemplate[]): void {
  try {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch {
    // Storage indisponível: ignora silenciosamente.
  }
}
