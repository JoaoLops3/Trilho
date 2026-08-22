import { reportError } from "../lib/observability";

export interface AsyncActionRunnerOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Default true — envia falhas inesperadas para observabilidade. */
  captureErrors?: boolean;
  operation?: string;
}

export type AsyncActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

/**
 * Núcleo puro do useAsyncAction: loading fica no hook; sucesso/erro aqui.
 * Separado para cobrir com Vitest sem DOM / Testing Library.
 */
export async function runAsyncAction<T>(
  asyncFn: () => Promise<T>,
  options: AsyncActionRunnerOptions = {},
): Promise<AsyncActionResult<T>> {
  const { onSuccess, onError, captureErrors = true, operation } = options;

  try {
    const value = await asyncFn();
    onSuccess?.();
    return { ok: true, value };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    if (captureErrors) {
      reportError(error, {
        surface: "async_action",
        operation,
      });
    }

    onError?.(error);
    return { ok: false, error };
  }
}
