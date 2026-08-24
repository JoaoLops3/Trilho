/**
 * Rate limit client-side para operações de Auth (defesa em profundidade).
 *
 * O GoTrue já limita por IP no servidor (supabase/config.toml → [auth.rate_limit]);
 * esta camada corta tentativas repetidas no device antes da rede, com feedback
 * claro de cooldown — mitiga força bruta local e spam de e-mails de recovery.
 *
 * Janela deslizante persistida em sessionStorage para sobreviver a reload da
 * tela de login. A chave (e-mail) é hasheada — nunca gravamos PII no storage.
 */

export type AuthRateLimitOperation =
  | "sign_in"
  | "sign_up"
  | "reset_password"
  | "update_password";

interface RateLimitRule {
  maxAttempts: number;
  windowMs: number;
}

const MINUTE_MS = 60_000;

/** Mais estritos que o servidor (30/5min por IP) — UX de cooldown antecipada. */
const RULES: Record<AuthRateLimitOperation, RateLimitRule> = {
  sign_in: { maxAttempts: 5, windowMs: 5 * MINUTE_MS },
  sign_up: { maxAttempts: 3, windowMs: 15 * MINUTE_MS },
  reset_password: { maxAttempts: 3, windowMs: 15 * MINUTE_MS },
  update_password: { maxAttempts: 5, windowMs: 15 * MINUTE_MS },
};

const STORAGE_KEY = "trilho:auth-rate-limit";

export type AuthRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

type AttemptLog = Record<string, number[]>;

/** djb2 — hash não-criptográfico só para não persistir e-mail em claro. */
function hashKey(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function entryKey(operation: AuthRateLimitOperation, key: string): string {
  return `${operation}:${hashKey(key.trim().toLowerCase())}`;
}

let memoryLog: AttemptLog | null = null;

function loadLog(): AttemptLog {
  if (memoryLog) return memoryLog;

  memoryLog = {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed)) {
          if (
            Array.isArray(value) &&
            value.every((item) => typeof item === "number")
          ) {
            memoryLog[key] = value;
          }
        }
      }
    }
  } catch {
    // sessionStorage indisponível ou corrompido — segue só em memória.
  }
  return memoryLog;
}

function persistLog(log: AttemptLog): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Quota/indisponível — rate limit continua valendo em memória.
  }
}

function prune(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((ts) => now - ts < windowMs);
}

/**
 * Registra uma tentativa e informa se ela pode prosseguir.
 * Bloqueada → `retryAfterMs` indica quanto falta para liberar (equivalente
 * client-side do header `Retry-After` de um 429).
 */
export function consumeAuthAttempt(
  operation: AuthRateLimitOperation,
  key: string,
  now: number = Date.now(),
): AuthRateLimitResult {
  const rule = RULES[operation];
  const log = loadLog();
  const id = entryKey(operation, key);

  const recent = prune(log[id] ?? [], rule.windowMs, now);

  if (recent.length >= rule.maxAttempts) {
    const oldest = Math.min(...recent);
    log[id] = recent;
    persistLog(log);
    return { ok: false, retryAfterMs: oldest + rule.windowMs - now };
  }

  recent.push(now);
  log[id] = recent;
  persistLog(log);
  return { ok: true };
}

/** Limpa o contador — chamar após sucesso (ex.: login correto). */
export function clearAuthAttempts(
  operation: AuthRateLimitOperation,
  key: string,
): void {
  const log = loadLog();
  delete log[entryKey(operation, key)];
  persistLog(log);
}

/** Reset total — usado em testes. */
export function resetAuthRateLimit(): void {
  memoryLog = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage indisponível — nada a limpar.
  }
}

/** Copy alinhada a MESSAGES.over_request_rate_limit (auth-errors.ts). */
export function formatRateLimitError(retryAfterMs: number): string {
  const totalSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (totalSeconds < 60) {
    return `Muitas tentativas. Aguarde ${totalSeconds} segundo${totalSeconds === 1 ? "" : "s"} e tente de novo.`;
  }
  const minutes = Math.ceil(totalSeconds / 60);
  return `Muitas tentativas. Aguarde ${minutes} minuto${minutes === 1 ? "" : "s"} e tente de novo.`;
}
