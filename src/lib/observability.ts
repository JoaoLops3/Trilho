import { captureException } from "./posthog";
import { getRuntimeContext } from "./runtime-context";

export type ErrorSurface =
  | "error_boundary"
  | "sync"
  | "auth"
  | "native"
  | "global"
  | "async_action";

export interface ObservabilityContext {
  surface: ErrorSurface;
  operation?: string;
  errorBoundaryContext?: string;
  componentStack?: string;
  pushKey?: string;
  authCode?: string;
}

export function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

/** Reporta erro rastreável com superfície + operação — único caminho para PostHog. */
export function reportError(err: unknown, context: ObservabilityContext): void {
  const error = toError(err);

  if (import.meta.env.DEV) {
    const label = context.operation
      ? `${context.surface}:${context.operation}`
      : context.surface;
    console.error(`[observability ${label}]`, error, context);
  }

  captureException(error, {
    ...getRuntimeContext(),
    error_surface: context.surface,
    ...(context.operation ? { operation: context.operation } : {}),
    ...(context.errorBoundaryContext
      ? { error_boundary_context: context.errorBoundaryContext }
      : {}),
    ...(context.componentStack
      ? { component_stack: truncate(context.componentStack, 2000) }
      : {}),
    ...(context.pushKey ? { sync_push_key: context.pushKey } : {}),
    ...(context.authCode ? { auth_error_code: context.authCode } : {}),
  });
}

/** Captura falhas não tratadas fora do React (rede, promises, plugins). */
export function installGlobalErrorHandlers(): () => void {
  const onWindowError = (event: ErrorEvent) => {
    reportError(event.error ?? event.message, {
      surface: "global",
      operation: "window.error",
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportError(event.reason, {
      surface: "global",
      operation: "unhandledrejection",
    });
  };

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
