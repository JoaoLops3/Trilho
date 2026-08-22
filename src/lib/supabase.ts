import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { clientEnv, isSupabaseEnvConfigured } from "./env";
import { authStorage } from "./secure-auth-storage";

let client: SupabaseClient<Database> | null = null;

/** Client Supabase com anon key. Retorna null se env não configurada (app segue só local). */
export function getSupabase(): SupabaseClient<Database> | null {
  const url = clientEnv.supabaseUrl;
  const anonKey = clientEnv.supabaseAnonKey;
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
  return isSupabaseEnvConfigured();
}
