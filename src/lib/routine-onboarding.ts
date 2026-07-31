import { STORAGE_KEYS } from "./storage-keys";

export function hasSeenRoutineOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.routineOnboardingSeen) === "1";
  } catch {
    return true;
  }
}

export function markRoutineOnboardingSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.routineOnboardingSeen, "1");
  } catch {
    // Storage indisponível: ignora.
  }
}
