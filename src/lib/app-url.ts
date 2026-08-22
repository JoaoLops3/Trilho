/**
 * URL base do app para redirects de auth (Supabase email / recovery).
 * Em produção, defina VITE_APP_URL no .env (ex. https://app.seudominio.com).
 */
import { clientEnv } from "./env";

export function getAppOrigin(): string {
  if (clientEnv.appUrl) {
    return clientEnv.appUrl;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5173";
}

export function getAuthRedirectPath(path = "/login"): string {
  return `${getAppOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** URLs que devem estar no Supabase Dashboard → Authentication → URL Configuration. */
export function getRequiredAuthRedirectUrls(): string[] {
  const origin = getAppOrigin();
  return [
    `${origin}/login`,
    `${origin}/cadastro`,
    `${origin}/recuperar-senha`,
    `${origin}/nova-senha`,
    "http://localhost:5173/login",
    "http://127.0.0.1:5173/login",
    "http://localhost:5173/nova-senha",
    "capacitor://localhost/login",
    "capacitor://localhost/nova-senha",
    "https://localhost/login",
    "https://localhost/nova-senha",
  ];
}
