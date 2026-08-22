import type { UserProfile } from "../types/avatar";

import {
  DEFAULT_DAILY_GOAL_MINUTES,
  LEGACY_DAILY_GOAL_MINUTES,
} from "./daily-goal";
import { userProfileSchema } from "./storage-schemas";
import { parseStorageJson } from "./storage-runtime";
import { STORAGE_KEYS } from "./storage-keys";

const STORAGE_KEY = STORAGE_KEYS.profile;

export const DEFAULT_ACCOUNT_NAME = "Alex";

/** Limite só para exibição no header do perfil (nome completo continua salvo). */
export const PROFILE_HEADER_NAME_MAX_LENGTH = 20;

const DEFAULT_PROFILE: UserProfile = {
  accountName: DEFAULT_ACCOUNT_NAME,
  nickname: null,
  avatarSeed: null,
  avatarStyle: "toon-head",
  dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
};

function resolveDailyGoalMinutes(parsed: Record<string, unknown>): number {
  if (
    typeof parsed.dailyGoalMinutes === "number" &&
    parsed.dailyGoalMinutes > 0
  ) {
    return parsed.dailyGoalMinutes;
  }
  // Perfil local já existente antes da feature: mantém 5h.
  return LEGACY_DAILY_GOAL_MINUTES;
}

export function getShownName(profile: UserProfile): string {
  return (
    profile.nickname?.trim() ||
    profile.accountName.trim() ||
    DEFAULT_ACCOUNT_NAME
  );
}

export function truncateForProfileHeader(
  name: string,
  maxLength = PROFILE_HEADER_NAME_MAX_LENGTH,
): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function isProfileHeaderNameTruncated(
  name: string,
  maxLength = PROFILE_HEADER_NAME_MAX_LENGTH,
): boolean {
  return name.trim().length > maxLength;
}

function migrateLegacyProfile(parsed: Record<string, unknown>): UserProfile {
  if (typeof parsed.accountName === "string") {
    return {
      accountName: parsed.accountName.trim() || DEFAULT_ACCOUNT_NAME,
      nickname:
        typeof parsed.nickname === "string" && parsed.nickname.trim()
          ? parsed.nickname.trim()
          : null,
      avatarSeed:
        typeof parsed.avatarSeed === "string" ? parsed.avatarSeed : null,
      avatarStyle: "toon-head",
      dailyGoalMinutes: resolveDailyGoalMinutes(parsed),
    };
  }

  const legacyDisplayName =
    typeof parsed.displayName === "string" ? parsed.displayName.trim() : "";

  return {
    accountName: legacyDisplayName || DEFAULT_ACCOUNT_NAME,
    nickname: null,
    avatarSeed:
      typeof parsed.avatarSeed === "string" ? parsed.avatarSeed : null,
    avatarStyle: "toon-head",
    dailyGoalMinutes: resolveDailyGoalMinutes(parsed),
  };
}

export function loadProfile(): UserProfile {
  try {
    const parsed = parseStorageJson(localStorage.getItem(STORAGE_KEY));
    if (parsed === null || parsed === undefined) {
      return { ...DEFAULT_PROFILE };
    }
    if (typeof parsed !== "object" || parsed === null) {
      return { ...DEFAULT_PROFILE };
    }

    const migrated = migrateLegacyProfile(parsed as Record<string, unknown>);
    const validated = userProfileSchema.safeParse(migrated);
    return validated.success ? validated.data : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage indisponível (modo privado, cota cheia): ignora silenciosamente.
  }
}
