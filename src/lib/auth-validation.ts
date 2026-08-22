import { PROFILE_HEADER_NAME_MAX_LENGTH } from "./profile-storage";

/** RFC 5321 — limite prático para e-mail no client. */
export const AUTH_EMAIL_MAX_LENGTH = 254;

/** Cadastro e recovery — alinhado a OWASP (mínimo 8). */
export const AUTH_PASSWORD_MIN_LENGTH = 8;

export const AUTH_DISPLAY_NAME_MIN = 2;
export const AUTH_DISPLAY_NAME_MAX = 50;

export const WEAK_PASSWORD_MESSAGE = `A senha deve ter pelo menos ${AUTH_PASSWORD_MIN_LENGTH} caracteres.`;
export const INVALID_EMAIL_MESSAGE = "Informe um e-mail válido.";

export function validateAuthEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Informe seu e-mail.";
  if (trimmed.length > AUTH_EMAIL_MAX_LENGTH) return INVALID_EMAIL_MESSAGE;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return INVALID_EMAIL_MESSAGE;
  }
  return null;
}

/** Login — aceita senhas legadas; só exige não vazio. */
export function validateLoginPassword(password: string): string | null {
  if (!password) return "Informe sua senha.";
  return null;
}

/** Cadastro, nova senha e recovery. */
export function validateSignupPassword(password: string): string | null {
  if (!password) return "Informe sua senha.";
  if (password.length < AUTH_PASSWORD_MIN_LENGTH) return WEAK_PASSWORD_MESSAGE;
  return null;
}

export function validateSignupPasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  const passwordError = validateSignupPassword(password);
  if (passwordError) return passwordError;
  if (password !== confirmation) return "As senhas não coincidem.";
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Informe seu nome.";
  if (trimmed.length < AUTH_DISPLAY_NAME_MIN) {
    return "O nome deve ter pelo menos 2 caracteres.";
  }
  if (trimmed.length > AUTH_DISPLAY_NAME_MAX) {
    return "O nome deve ter no máximo 50 caracteres.";
  }
  return null;
}

export function validateNickname(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Informe seu nome.";
  if (trimmed.length < AUTH_DISPLAY_NAME_MIN) {
    return "O nome deve ter pelo menos 2 caracteres.";
  }
  if (trimmed.length > PROFILE_HEADER_NAME_MAX_LENGTH) {
    return `O nome deve ter no máximo ${PROFILE_HEADER_NAME_MAX_LENGTH} caracteres.`;
  }
  return null;
}
