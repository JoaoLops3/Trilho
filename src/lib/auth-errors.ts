import type { AuthError } from "@supabase/supabase-js";

import { reportError } from "./observability";
import { PROFILE_HEADER_NAME_MAX_LENGTH } from "./profile-storage";

/** Mensagem genérica — nunca devolver `error.message` cru do GoTrue ao usuário. */
export const GENERIC_AUTH_ERROR =
  "Não foi possível concluir. Tente novamente.";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed:
    "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  user_already_registered: "Este e-mail já está cadastrado.",
  weak_password: "A senha deve ter pelo menos 6 caracteres.",
  invalid_email: "Informe um e-mail válido.",
  signup_disabled: "Cadastro temporariamente indisponível.",
  over_request_rate_limit:
    "Muitas tentativas. Aguarde um momento e tente de novo.",
  same_password: "A nova senha deve ser diferente da atual.",
  session_expired: "Sessão expirada. Solicite um novo link de recuperação.",
};

/** Códigos estáveis do GoTrue (`AuthError.code`) quando presentes. */
const BY_CODE: Record<string, string> = {
  invalid_credentials: MESSAGES.invalid_credentials,
  email_not_confirmed: MESSAGES.email_not_confirmed,
  user_already_exists: MESSAGES.user_already_registered,
  user_already_registered: MESSAGES.user_already_registered,
  weak_password: MESSAGES.weak_password,
  validation_failed: MESSAGES.invalid_email,
  signup_disabled: MESSAGES.signup_disabled,
  over_request_rate_limit: MESSAGES.over_request_rate_limit,
  over_email_send_rate_limit: MESSAGES.over_request_rate_limit,
  same_password: MESSAGES.same_password,
  otp_expired: MESSAGES.session_expired,
  flow_state_expired: MESSAGES.session_expired,
};

/**
 * Traduz erros de Auth do Supabase para copy em PT-BR.
 * Em caso desconhecido, devolve mensagem genérica — nunca o texto cru do servidor.
 */
export function mapAuthError(error: AuthError | null): string | null {
  if (!error) return null;

  const code = error.code?.trim().toLowerCase();
  if (code && BY_CODE[code]) {
    return BY_CODE[code];
  }

  const message = error.message ?? "";

  if (message.includes("Invalid login credentials")) {
    return MESSAGES.invalid_credentials;
  }
  if (message.includes("Email not confirmed")) {
    return MESSAGES.email_not_confirmed;
  }
  if (message.includes("User already registered")) {
    return MESSAGES.user_already_registered;
  }
  if (message.includes("Password should be at least")) {
    return MESSAGES.weak_password;
  }
  if (message.includes("Unable to validate email")) {
    return MESSAGES.invalid_email;
  }
  if (message.includes("Signups not allowed")) {
    return MESSAGES.signup_disabled;
  }
  if (message.toLowerCase().includes("rate limit")) {
    return MESSAGES.over_request_rate_limit;
  }
  if (message.toLowerCase().includes("same password")) {
    return MESSAGES.same_password;
  }
  if (
    message.toLowerCase().includes("expired") ||
    message.toLowerCase().includes("otp")
  ) {
    return MESSAGES.session_expired;
  }

  return GENERIC_AUTH_ERROR;
}

/**
 * Traduz erro de Auth e reporta códigos desconhecidos para observabilidade.
 * Erros mapeados (credenciais inválidas, etc.) não são enviados — são esperados.
 */
export function mapAuthErrorWithTelemetry(
  error: AuthError | null,
  operation: string,
): string | null {
  const mapped = mapAuthError(error);
  if (error && mapped === GENERIC_AUTH_ERROR) {
    reportError(error, {
      surface: "auth",
      operation,
      authCode: error.code ?? undefined,
    });
  }
  return mapped;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Informe seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return MESSAGES.invalid_email;
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Informe sua senha.";
  if (password.length < 6) return MESSAGES.weak_password;
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;
  if (password !== confirmation) return "As senhas não coincidem.";
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Informe seu nome.";
  if (trimmed.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  if (trimmed.length > 50) return "O nome deve ter no máximo 50 caracteres.";
  return null;
}

export function validateNickname(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Informe seu nome.";
  if (trimmed.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  if (trimmed.length > PROFILE_HEADER_NAME_MAX_LENGTH) {
    return `O nome deve ter no máximo ${PROFILE_HEADER_NAME_MAX_LENGTH} caracteres.`;
  }
  return null;
}
