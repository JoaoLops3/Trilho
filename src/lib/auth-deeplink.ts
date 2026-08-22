import { Capacitor } from "@capacitor/core";
import { getSupabase } from "./supabase";

const RECOVERY_FLAG = "trilho:password-recovery";

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

  try {
    const parsed = new URL(url);
    const isRecovery = isRecoveryUrl(parsed);
    if (isRecovery) {
      markPasswordRecoveryPending();
    }

    const code = parsed.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        clearAuthParamsFromUrl();
        return { handled: true, isRecovery };
      }
      return { handled: false, isRecovery };
    }

    const hash = parsed.hash.startsWith("#")
      ? parsed.hash.slice(1)
      : parsed.hash;
    if (!hash) return { handled: false, isRecovery };

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!error) {
        clearAuthParamsFromUrl();
        return { handled: true, isRecovery };
      }
    }

    return { handled: false, isRecovery };
  } catch {
    // Link inválido ou expirado — auth state permanece inalterado.
    return { handled: false, isRecovery: false };
  }
}
