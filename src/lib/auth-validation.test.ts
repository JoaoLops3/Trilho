import { describe, expect, it } from "vitest";
import {
  AUTH_EMAIL_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  validateAuthEmail,
  validateDisplayName,
  validateLoginPassword,
  validateNickname,
  validateSignupPassword,
  validateSignupPasswordConfirmation,
  WEAK_PASSWORD_MESSAGE,
} from "./auth-validation";

describe("validateAuthEmail", () => {
  it("rejeita vazio, longo demais e formato inválido", () => {
    expect(validateAuthEmail("")).toBe("Informe seu e-mail.");
    expect(validateAuthEmail("not-an-email")).toBe("Informe um e-mail válido.");
    expect(
      validateAuthEmail(`${"a".repeat(AUTH_EMAIL_MAX_LENGTH)}@x.com`),
    ).toBe("Informe um e-mail válido.");
  });

  it("aceita e-mail válido com trim", () => {
    expect(validateAuthEmail("  user@example.com  ")).toBeNull();
  });

  it("aceita unicode no local-part", () => {
    expect(validateAuthEmail("josé@example.com")).toBeNull();
  });
});

describe("validateLoginPassword", () => {
  it("exige não vazio mas aceita senha curta legada", () => {
    expect(validateLoginPassword("")).toBe("Informe sua senha.");
    expect(validateLoginPassword("123456")).toBeNull();
  });
});

describe("validateSignupPassword", () => {
  it(`exige mínimo de ${AUTH_PASSWORD_MIN_LENGTH} caracteres`, () => {
    expect(validateSignupPassword("")).toBe("Informe sua senha.");
    expect(validateSignupPassword("1234567")).toBe(WEAK_PASSWORD_MESSAGE);
    expect(validateSignupPassword("12345678")).toBeNull();
  });
});

describe("validateSignupPasswordConfirmation", () => {
  it("exige senhas iguais", () => {
    expect(validateSignupPasswordConfirmation("12345678", "87654321")).toBe(
      "As senhas não coincidem.",
    );
  });
});

describe("validateDisplayName", () => {
  it("valida comprimento", () => {
    expect(validateDisplayName("A")).toMatch(/2 caracteres/);
    expect(validateDisplayName("João")).toBeNull();
  });
});

describe("validateNickname", () => {
  it("respeita limite do header", () => {
    expect(validateNickname("x".repeat(30))).toMatch(/no máximo/);
  });
});
