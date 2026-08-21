import posthog from "posthog-js";
import { Capacitor } from "@capacitor/core";
import { STORAGE_KEYS } from "./storage-keys";

const apiKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const apiHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined;

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

interface QueuedEvent {
  event: string;
  properties?: EventProperties;
}

export type AnalyticsConsent = "granted" | "denied";

let initialized = false;
let scheduled = false;
const pendingEvents: QueuedEvent[] = [];

/**
 * Consentimento de analytics: `null` significa que o usuário ainda não
 * respondeu — nesse caso nada é enviado ao PostHog (default privado).
 */
export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEYS.analyticsConsent);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(granted: boolean): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.analyticsConsent,
      granted ? "granted" : "denied",
    );
  } catch {
    // Storage indisponível — segue apenas com o estado em memória do PostHog.
  }

  if (granted) {
    if (initialized) {
      posthog.opt_in_capturing();
    } else {
      schedulePostHogInit();
    }
  } else {
    pendingEvents.length = 0;
    if (initialized) {
      posthog.opt_out_capturing();
    }
  }
}

export function initPostHog(): void {
  if (initialized || !apiKey || typeof window === "undefined") return;
  if (getAnalyticsConsent() !== "granted") return;
  initialized = true;

  const isNative = Capacitor.isNativePlatform();

  posthog.init(apiKey, {
    api_host: apiHost ?? "https://us.i.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    persistence: "localStorage",
    disable_session_recording: isNative,
    disable_surveys: isNative,
    ...(isNative
      ? {
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
        }
      : {}),
  });

  // Um opt-out anterior fica persistido pelo próprio PostHog; como o init só
  // roda com consentimento concedido, garante o estado de captura ativo.
  if (posthog.has_opted_out_capturing()) {
    posthog.opt_in_capturing();
  }

  for (const { event, properties } of pendingEvents) {
    posthog.capture(event, properties);
  }
  pendingEvents.length = 0;
}

/**
 * Agenda a inicialização do PostHog para depois do primeiro paint, evitando que
 * o boot da aplicação concorra com o carregamento dos scripts de analytics.
 * Só agenda se o usuário tiver consentido com a coleta de dados de uso.
 */
export function schedulePostHogInit(): void {
  if (initialized || scheduled || !apiKey || typeof window === "undefined")
    return;
  if (getAnalyticsConsent() !== "granted") return;
  scheduled = true;

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => initPostHog(), { timeout: 3000 });
  } else {
    window.setTimeout(() => initPostHog(), 1500);
  }
}

export { posthog };

export function getDistinctId(): string {
  return posthog.get_distinct_id();
}

export function captureEvent(
  event: string,
  properties?: EventProperties,
): void {
  if (!apiKey) return;
  if (getAnalyticsConsent() === "denied") return;
  if (!initialized) {
    // Sem resposta ainda: o evento fica na fila e só é enviado se o usuário
    // aceitar (o init dá flush); se recusar, a fila é descartada.
    pendingEvents.push({ event, properties });
    schedulePostHogInit();
    return;
  }
  posthog.capture(event, properties);
}

export function captureException(
  error: unknown,
  properties?: EventProperties,
): void {
  if (!apiKey) return;
  if (getAnalyticsConsent() !== "granted") return;
  initPostHog();
  posthog.captureException(error, properties);
}

export function identifyUser(
  userId: string,
  properties?: EventProperties,
): void {
  if (!apiKey) return;
  if (getAnalyticsConsent() !== "granted") return;
  initPostHog();
  posthog.identify(userId, properties);
}

export function resetAnalyticsUser(): void {
  if (!apiKey) return;
  if (!initialized) return;
  posthog.reset();
}
