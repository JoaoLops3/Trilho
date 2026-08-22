import { Capacitor } from "@capacitor/core";
import { getSupabase } from "./supabase";

const RECOVERY_FLAG = "trilho:password-recovery";

const MIN_TOKEN_LENGTH = 20;
const MAX_TOKEN_LENGTH = 8192;
const TOKEN_PATTERN = /^[\w\-._+/=]+$/;

export type ParsedAuthDeepLink = {
  isRecovery: boolean;
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasAuthParams: boolean;
};

/** Persistência leve do fluxo de recovery (sobrevive remount; some no signOut). */
export function markPasswordRecoveryPending(): void {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, "1");
  } catch {
    // sessionStorage indisponível — o evento PASSWORD_RECOVERY ainda cobre o caso.
  }
}

export function clearPasswordRecoveryPending(): void {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {
    // ignore
  }
}

export function readPasswordRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

function isRecoveryUrl(url: URL): boolean {
  if (url.searchParams.get("type") === "recovery") return true;
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (!hash) return false;
  return new URLSearchParams(hash).get("type") === "recovery";
}

function isPlausibleAuthToken(value: string): boolean {
  const len = value.length;
  if (len < MIN_TOKEN_LENGTH || len > MAX_TOKEN_LENGTH) return false;
  return TOKEN_PATTERN.test(value);
}

/**
 * Parser puro de deep links Supabase Auth — valida formato antes de setSession.
 * Retorna null se URL malformada ou tokens implausíveis.
 */
export function parseAuthDeepLinkUrl(rawUrl: string): ParsedAuthDeepLink | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const isRecovery = isRecoveryUrl(parsed);
  const codeRaw = parsed.searchParams.get("code");
  const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
  const hashParams = hash ? new URLSearchParams(hash) : null;
  const accessRaw = hashParams?.get("access_token") ?? null;
  const refreshRaw = hashParams?.get("refresh_token") ?? null;

  const hasPartialHashPair =
    Boolean(accessRaw) !== Boolean(refreshRaw);
  if (hasPartialHashPair) return null;

  const code = codeRaw && isPlausibleAuthToken(codeRaw) ? codeRaw : null;
  const accessToken =
    accessRaw && isPlausibleAuthToken(accessRaw) ? accessRaw : null;
  const refreshToken =
    refreshRaw && isPlausibleAuthToken(refreshRaw) ? refreshRaw : null;

  if (codeRaw && !code) return null;
  if (accessRaw && !accessToken) return null;
  if (refreshRaw && !refreshToken) return null;

  const hasAuthParams =
    Boolean(code) ||
    Boolean(accessToken && refreshToken) ||
    isRecovery;

  return {
    isRecovery,
    code,
    accessToken,
    refreshToken,
    hasAuthParams,
  };
}

/**
 * Remove code/hash de auth da barra de endereço (web).
 * No Capacitor o URL do deep link não fica no WebView — no-op seguro.
 */
export function clearAuthParamsFromUrl(): void {
  if (typeof window === "undefined" || Capacitor.isNativePlatform()) return;

  const url = new URL(window.location.href);
  const hadAuthParams =
    Boolean(url.hash) ||
    url.searchParams.has("code") ||
    url.searchParams.has("type");
  if (!hadAuthParams) return;

  url.hash = "";
  url.searchParams.delete("code");
  url.searchParams.delete("type");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

/** Limpa sessão parcial após deep link inválido ou expirado. */
export async function invalidateAuthAfterFailedDeepLink(): Promise<void> {
  clearPasswordRecoveryPending();
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }
  clearAuthParamsFromUrl();
}

export type AuthDeepLinkResult = {
  handled: boolean;
  isRecovery: boolean;
};

/** Processa deep links de confirmação de e-mail / recovery no Capacitor e na web. */
export async function handleAuthDeepLink(
  url: string,
): Promise<AuthDeepLinkResult> {
  const supabase = getSupabase();
  if (!supabase) return { handled: false, isRecovery: false };

  const parsed = parseAuthDeepLinkUrl(url);
  if (!parsed) {
    await invalidateAuthAfterFailedDeepLink();
    return { handled: false, isRecovery: false };
  }

  const { isRecovery, code, accessToken, refreshToken, hasAuthParams } = parsed;

  if (isRecovery) {
    markPasswordRecoveryPending();
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      clearAuthParamsFromUrl();
      return { handled: true, isRecovery };
    }
    await invalidateAuthAfterFailedDeepLink();
    return { handled: false, isRecovery };
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      clearAuthParamsFromUrl();
      return { handled: true, isRecovery };
    }
    await invalidateAuthAfterFailedDeepLink();
    return { handled: false, isRecovery };
  }

  if (hasAuthParams && isRecovery) {
    await invalidateAuthAfterFailedDeepLink();
  }

  return { handled: false, isRecovery };
}
