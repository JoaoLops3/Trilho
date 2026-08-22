import type { AuthError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GENERIC_AUTH_ERROR,
  mapAuthError,
  mapAuthErrorWithTelemetry,
  validateDisplayName,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordConfirmation,
} from "./auth-errors";

vi.mock("./observability", () => ({
  reportError: vi.fn(),
}));

import { reportError } from "./observability";

function authErr(
  partial: Partial<AuthError> & Pick<AuthError, "message">,
): AuthError {
  return {
    name: "AuthError",
    status: 400,
    code: partial.code,
    ...partial,
  } as AuthError;
}

describe("mapAuthError", () => {
  it("retorna null sem erro", () => {
    expect(mapAuthError(null)).toBeNull();
  });

  it("mapeia por código GoTrue", () => {
    expect(
      mapAuthError(authErr({ message: "x", code: "invalid_credentials" })),
    ).toBe("E-mail ou senha incorretos.");
  });

  it("mapeia por mensagem conhecida", () => {
    expect(
      mapAuthError(authErr({ message: "Invalid login credentials" })),
    ).toBe("E-mail ou senha incorretos.");
  });

  it("nunca devolve mensagem crua para erro desconhecido", () => {
    expect(
      mapAuthError(authErr({ message: "Internal server explosion" })),
    ).toBe(GENERIC_AUTH_ERROR);
  });
});

describe("mapAuthErrorWithTelemetry", () => {
  beforeEach(() => {
    vi.mocked(reportError).mockClear();
  });

  it("não reporta erros mapeados esperados", () => {
    mapAuthErrorWithTelemetry(
      authErr({ message: "Invalid login credentials" }),
      "sign_in",
    );
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reporta erros genéricos desconhecidos", () => {
    mapAuthErrorWithTelemetry(
      authErr({ message: "weird", code: "unknown_code" }),
      "sign_in",
    );
    expect(reportError).toHaveBeenCalledOnce();
  });
});

describe("validateEmail", () => {
  it("rejeita vazio e formato inválido", () => {
    expect(validateEmail("")).toBe("Informe seu e-mail.");
    expect(validateEmail("not-an-email")).toBe("Informe um e-mail válido.");
  });

  it("aceita e-mail válido", () => {
    expect(validateEmail("  user@example.com  ")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("exige mínimo de 6 caracteres", () => {
    expect(validatePassword("")).toBe("Informe sua senha.");
    expect(validatePassword("12345")).toBe(
      "A senha deve ter pelo menos 6 caracteres.",
    );
    expect(validatePassword("123456")).toBeNull();
  });
});

describe("validatePasswordConfirmation", () => {
  it("exige senhas iguais", () => {
    expect(validatePasswordConfirmation("123456", "654321")).toBe(
      "As senhas não coincidem.",
    );
  });
});

describe("validateDisplayName", () => {
  it("valida comprimento", () => {
    expect(validateDisplayName("A")).toBe(
      "O nome deve ter pelo menos 2 caracteres.",
    );
    expect(validateDisplayName("João")).toBeNull();
  });
});

describe("validateNickname", () => {
  it("respeita limite do header", () => {
    expect(validateNickname("x".repeat(30))).toMatch(/no máximo/);
  });
});
