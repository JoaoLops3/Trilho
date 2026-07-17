import type { RoutineTemplate } from "../types/routine";

import { STORAGE_KEYS } from "./storage-keys";

const ROUTINES_KEY = STORAGE_KEYS.routines;

export function loadRoutines(): RoutineTemplate[] {
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RoutineTemplate[];
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
