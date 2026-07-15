import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { authStorage } from "./secure-auth-storage";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Em dev, alerta se variáveis VITE_ parecem conter chaves privilegiadas (service_role, jwt).
 * Nunca exponha service_role no bundle Capacitor.
 */
function warnPrivilegedViteEnv(): void {
  if (!import.meta.env.DEV) return;

  const entries = Object.entries(import.meta.env) as [
    string,
    string | boolean | undefined,
  ][];
  for (const [key, value] of entries) {
    if (!key.startsWith("VITE_") || typeof value !== "string" || !value)
      continue;
    const combined = `${key}:${value}`;
    if (/service_role|jwt_secret|service_role_key/i.test(combined)) {
      console.warn(
        `[supabase] Chave privilegiada detectada com prefixo VITE_: ${key}. Use service_role apenas em Edge Functions / CI.`,
      );
    }
  }
}

warnPrivilegedViteEnv();

let client: SupabaseClient<Database> | null = null;

/** Client Supabase com anon key. Retorna null se env não configurada (app segue só local). */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storage: authStorage,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}
