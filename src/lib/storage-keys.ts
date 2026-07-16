const PREFIX = "trilho";

export const STORAGE_KEYS = {
  tasks: `${PREFIX}:tasks`,
  history: `${PREFIX}:history`,
  profile: `${PREFIX}:profile`,
  notifications: `${PREFIX}:notifications`,
  notificationPreferences: `${PREFIX}:notification-preferences`,
  notificationPermissionPromptSeen: `${PREFIX}:notification-permission-prompt-seen`,
  lastFocusDay: `${PREFIX}:last-focus-day`,
  analyticsConsent: `${PREFIX}:analytics-consent`,
} as const;

export const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);

/** Chaves legadas (App Rotina) — usadas só na migração one-shot. Chaves criadas
 * depois do rebrand (ex: analyticsConsent) não têm equivalente legado. */
export const LEGACY_STORAGE_KEYS: Partial<
  Record<keyof typeof STORAGE_KEYS, string>
> = {
  tasks: "app-rotina:tasks",
  history: "app-rotina:history",
  profile: "app-rotina:profile",
  notifications: "app-rotina:notifications",
  notificationPreferences: "app-rotina:notification-preferences",
  notificationPermissionPromptSeen:
    "app-rotina:notification-permission-prompt-seen",
  lastFocusDay: "app-rotina:last-focus-day",
};

const MIGRATION_FLAG = `${PREFIX}:storage-migrated-v1`;

export function migrateLegacyStorageKeys(): void {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG) === "1") return;

  for (const key of Object.keys(
    STORAGE_KEYS,
  ) as (keyof typeof STORAGE_KEYS)[]) {
    const legacyKey = LEGACY_STORAGE_KEYS[key];
    if (!legacyKey) continue;
    const newKey = STORAGE_KEYS[key];
    const legacyValue = localStorage.getItem(legacyKey);
    const currentValue = localStorage.getItem(newKey);

    if (legacyValue !== null && currentValue === null) {
      localStorage.setItem(newKey, legacyValue);
    }

    if (legacyValue !== null) {
      localStorage.removeItem(legacyKey);
    }
  }

  localStorage.setItem(MIGRATION_FLAG, "1");
}
