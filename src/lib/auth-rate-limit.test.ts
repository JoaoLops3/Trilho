import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearAuthAttempts,
  consumeAuthAttempt,
  formatRateLimitError,
  resetAuthRateLimit,
} from "./auth-rate-limit";

const EMAIL = "user@example.com";
const T0 = 1_700_000_000_000;

function installSessionStorageMock(): () => void {
  const store: Record<string, string> = {};
  const original = (globalThis as { sessionStorage?: Storage }).sessionStorage;

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    },
  });

  return () => {
    if (original === undefined) {
      delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
    } else {
      Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: original,
      });
    }
  };
}

describe("consumeAuthAttempt", () => {
  let restore: () => void;

  beforeEach(() => {
    restore = installSessionStorageMock();
    resetAuthRateLimit();
  });

  afterEach(() => {
    resetAuthRateLimit();
    restore();
  });

  it("permite até 5 sign_in e bloqueia o 6º com retryAfterMs", () => {
    for (let i = 0; i < 5; i++) {
      expect(consumeAuthAttempt("sign_in", EMAIL, T0 + i)).toEqual({
        ok: true,
      });
    }
    const blocked = consumeAuthAttempt("sign_in", EMAIL, T0 + 5);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(5 * 60_000);
    }
  });

  it("libera após a janela deslizante expirar", () => {
    for (let i = 0; i < 5; i++) {
      consumeAuthAttempt("sign_in", EMAIL, T0);
    }
    expect(consumeAuthAttempt("sign_in", EMAIL, T0 + 1).ok).toBe(false);
    expect(consumeAuthAttempt("sign_in", EMAIL, T0 + 5 * 60_000 + 1).ok).toBe(
      true,
    );
  });

  it("sign_up e reset_password bloqueiam no 4º na janela de 15 min", () => {
    for (const op of ["sign_up", "reset_password"] as const) {
      for (let i = 0; i < 3; i++) {
        expect(consumeAuthAttempt(op, EMAIL, T0 + i).ok).toBe(true);
      }
      expect(consumeAuthAttempt(op, EMAIL, T0 + 3).ok).toBe(false);
    }
  });

  it("contadores são isolados por operação e por e-mail normalizado", () => {
    for (let i = 0; i < 5; i++) {
      consumeAuthAttempt("sign_in", EMAIL, T0);
    }
    // Mesmo e-mail com caixa/espaço diferente → mesma chave (bloqueado).
    expect(
      consumeAuthAttempt("sign_in", `  ${EMAIL.toUpperCase()} `, T0).ok,
    ).toBe(false);
    // Outro e-mail e outra operação seguem liberados.
    expect(consumeAuthAttempt("sign_in", "outro@example.com", T0).ok).toBe(
      true,
    );
    expect(consumeAuthAttempt("sign_up", EMAIL, T0).ok).toBe(true);
  });

  it("clearAuthAttempts zera o contador após sucesso", () => {
    for (let i = 0; i < 5; i++) {
      consumeAuthAttempt("sign_in", EMAIL, T0);
    }
    clearAuthAttempts("sign_in", EMAIL);
    expect(consumeAuthAttempt("sign_in", EMAIL, T0 + 1).ok).toBe(true);
  });

  it("persiste em sessionStorage sem e-mail em claro", () => {
    consumeAuthAttempt("sign_in", EMAIL, T0);
    const raw = sessionStorage.getItem("trilho:auth-rate-limit");
    expect(raw).not.toBeNull();
    expect(raw).not.toContain(EMAIL);
    expect(raw).not.toContain("user");
  });

  it("funciona sem sessionStorage (fallback em memória)", () => {
    restore();
    resetAuthRateLimit();
    for (let i = 0; i < 5; i++) {
      expect(consumeAuthAttempt("sign_in", EMAIL, T0).ok).toBe(true);
    }
    expect(consumeAuthAttempt("sign_in", EMAIL, T0).ok).toBe(false);
    restore = installSessionStorageMock();
  });

  it("ignora payload corrompido no storage", () => {
    sessionStorage.setItem("trilho:auth-rate-limit", "{corrompido");
    resetAuthRateLimit();
    sessionStorage.setItem("trilho:auth-rate-limit", "{corrompido");
    expect(consumeAuthAttempt("sign_in", EMAIL, T0).ok).toBe(true);
  });
});

describe("formatRateLimitError", () => {
  it("formata segundos e minutos em PT-BR", () => {
    expect(formatRateLimitError(500)).toBe(
      "Muitas tentativas. Aguarde 1 segundo e tente de novo.",
    );
    expect(formatRateLimitError(30_000)).toBe(
      "Muitas tentativas. Aguarde 30 segundos e tente de novo.",
    );
    expect(formatRateLimitError(60_000)).toBe(
      "Muitas tentativas. Aguarde 1 minuto e tente de novo.",
    );
    expect(formatRateLimitError(4 * 60_000 + 1)).toBe(
      "Muitas tentativas. Aguarde 5 minutos e tente de novo.",
    );
  });
});
