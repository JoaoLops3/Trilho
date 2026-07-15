import { STORAGE_KEYS } from "./storage-keys";

export function hasSeenNotificationPermissionPrompt(): boolean {
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.notificationPermissionPromptSeen) ===
      "1"
    );
  } catch {
    return true;
  }
}

export function markNotificationPermissionPromptSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.notificationPermissionPromptSeen, "1");
  } catch {
    // Storage indisponível: ignora.
  }
}
