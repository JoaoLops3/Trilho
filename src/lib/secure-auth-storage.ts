import { Capacitor } from "@capacitor/core";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import type { SupportedStorage } from "@supabase/supabase-js";

const MIGRATION_FLAG = "trilho:auth-storage-migrated";
const SUPABASE_AUTH_KEY_PATTERN = /^sb-.*-auth-token$/;

const webStorage: SupportedStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => {
    localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
};

function findSupabaseAuthKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && SUPABASE_AUTH_KEY_PATTERN.test(key)) {
      keys.push(key);
    }
  }
  return keys;
}

/** Copia tokens de sessão do localStorage para Keychain/Keystore (one-shot). */
async function migrateAuthTokensFromLocalStorage(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG) === "1") return;

  for (const key of findSupabaseAuthKeys()) {
    const value = localStorage.getItem(key);
    if (!value) continue;

    const existing = await SecureStorage.getItem(key);
    if (existing === null) {
      await SecureStorage.setItem(key, value);
    }
    localStorage.removeItem(key);
  }

  localStorage.setItem(MIGRATION_FLAG, "1");
}

const nativeStorage: SupportedStorage = {
  getItem: (key) => SecureStorage.getItem(key),
  setItem: (key, value) => SecureStorage.setItem(key, value),
  removeItem: (key) => SecureStorage.removeItem(key),
};

let migrationPromise: Promise<void> | null = null;

function ensureNativeMigration(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateAuthTokensFromLocalStorage().catch(() => {
      // Falha na migração não deve impedir o boot; sessão pode ser relogada.
    });
  }
  return migrationPromise;
}

/**
 * Storage do Supabase Auth: Keychain (iOS) / Keystore (Android) no nativo;
 * localStorage no web (dev).
 */
export const authStorage: SupportedStorage = Capacitor.isNativePlatform()
  ? {
      getItem: async (key) => {
        await ensureNativeMigration();
        return nativeStorage.getItem(key);
      },
      setItem: async (key, value) => {
        await ensureNativeMigration();
        await nativeStorage.setItem(key, value);
      },
      removeItem: async (key) => {
        await ensureNativeMigration();
        await nativeStorage.removeItem(key);
      },
    }
  : webStorage;
