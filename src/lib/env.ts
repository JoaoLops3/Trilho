import { z } from "zod";

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

const supabaseUrlSchema = z
  .string()
  .url()
  .superRefine((value, ctx) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "VITE_SUPABASE_URL deve usar https",
        });
        return;
      }
      if (!parsed.hostname.endsWith(".supabase.co")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "VITE_SUPABASE_URL deve ser *.supabase.co",
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "VITE_SUPABASE_URL inválida",
      });
    }
  });

const supabaseAnonKeySchema = z.string().min(1, "VITE_SUPABASE_ANON_KEY vazia");

const posthogKeySchema = z.string().min(1);

const posthogHostSchema = z.string().url();

const appUrlSchema = z.string().url();

const clientEnvSchema = z
  .object({
    supabaseUrl: supabaseUrlSchema.optional(),
    supabaseAnonKey: supabaseAnonKeySchema.optional(),
    posthogKey: posthogKeySchema.optional(),
    posthogHost: posthogHostSchema.optional(),
    appUrl: appUrlSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasUrl = Boolean(data.supabaseUrl);
    const hasKey = Boolean(data.supabaseAnonKey);
    if (hasUrl === hasKey) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar ambos definidos ou ambos ausentes",
      path: hasUrl ? ["supabaseAnonKey"] : ["supabaseUrl"],
    });
  });

export interface ClientEnv {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  posthogKey?: string;
  posthogHost: string;
  appUrl?: string;
}

export interface RawClientEnvInput {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_POSTHOG_KEY?: string;
  VITE_POSTHOG_HOST?: string;
  VITE_APP_URL?: string;
}

export type ClientEnvParseResult =
  | { success: true; env: ClientEnv }
  | { success: false; issues: string[] };

function optionalEnvString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Normaliza URL Supabase removendo barra final. */
function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Normaliza URL de app removendo barra final. */
function normalizeAppUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Valida variáveis VITE_ do client. Par Supabase incompleto ou inválido →
 * falha parse; caller degrada para offline-only (sem cloud).
 */
export function parseRawClientEnv(
  raw: RawClientEnvInput,
): ClientEnvParseResult {
  const candidate = {
    supabaseUrl: optionalEnvString(raw.VITE_SUPABASE_URL),
    supabaseAnonKey: optionalEnvString(raw.VITE_SUPABASE_ANON_KEY),
    posthogKey: optionalEnvString(raw.VITE_POSTHOG_KEY),
    posthogHost: optionalEnvString(raw.VITE_POSTHOG_HOST),
    appUrl: optionalEnvString(raw.VITE_APP_URL),
  };

  const parsed = clientEnvSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map(
        (issue) => issue.path.join(".") + ": " + issue.message,
      ),
    };
  }

  const data = parsed.data;
  return {
    success: true,
    env: {
      supabaseUrl: data.supabaseUrl
        ? normalizeSupabaseUrl(data.supabaseUrl)
        : undefined,
      supabaseAnonKey: data.supabaseAnonKey,
      posthogKey: data.posthogKey,
      posthogHost: data.posthogHost ?? DEFAULT_POSTHOG_HOST,
      appUrl: data.appUrl ? normalizeAppUrl(data.appUrl) : undefined,
    },
  };
}

function loadClientEnv(): ClientEnv {
  const result = parseRawClientEnv({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
    VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
  });

  if (!result.success) {
    if (import.meta.env.DEV) {
      console.error(
        `[env] Configuração inválida — app segue offline-only:\n${result.issues.map((i) => `  - ${i}`).join("\n")}`,
      );
    }
    return { posthogHost: DEFAULT_POSTHOG_HOST };
  }

  return result.env;
}

/** Env validado uma vez no boot do bundle. */
export const clientEnv: ClientEnv = loadClientEnv();

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(clientEnv.supabaseUrl && clientEnv.supabaseAnonKey);
}

/** Garante parse no boot antes do render (side-effect idempotente). */
export function validateClientEnvAtBoot(): void {
  void clientEnv;
}

/**
 * Em dev, alerta se variáveis VITE_ parecem conter chaves privilegiadas.
 * Nunca exponha service_role no bundle Capacitor.
 */
export function warnPrivilegedViteEnv(): void {
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
        `[env] Chave privilegiada detectada com prefixo VITE_: ${key}. Use service_role apenas em Edge Functions / CI.`,
      );
    }
  }
}
