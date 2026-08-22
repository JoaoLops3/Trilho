import { Capacitor } from "@capacitor/core";
import { APP_VERSION } from "./app-brand";

/** Contexto estável anexado a eventos e exceções (versão, plataforma). */
export function getRuntimeContext(): Record<string, string | boolean> {
  return {
    app_version: APP_VERSION,
    platform: Capacitor.getPlatform(),
    is_native: Capacitor.isNativePlatform(),
  };
}
