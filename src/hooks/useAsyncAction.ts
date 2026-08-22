import { useState, useCallback } from "react";
import { reportError } from "../lib/observability";

interface UseAsyncActionOptions {
  /**
   * Callback executado em caso de sucesso
   */
  onSuccess?: () => void;
  /**
   * Callback executado em caso de erro
   */
  onError?: (error: Error) => void;
  /**
   * Se true, captura exceções e envia para PostHog automaticamente
   */
  captureErrors?: boolean;
  /** Identificador da operação para observabilidade (ex: "save_profile"). */
  operation?: string;
}

/**
 * Hook para gerenciar estados de loading/error em ações assíncronas.
 * 
 * Retorna:
 * - isLoading: boolean indicando se a ação está em andamento
 * - error: Error | null com o último erro capturado
 * - execute: função wrapper que adiciona tratamento de loading/error
 * - reset: limpa o estado de erro
 * 
 * Uso:
 * ```tsx
 * const { isLoading, error, execute } = useAsyncAction({
 *   onSuccess: () => toast.success('Salvo!'),
 *   captureErrors: true,
 * });
 * 
 * const handleSave = execute(async () => {
 *   await api.save(data);
 * });
 * ```
 */
export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const { onSuccess, onError, captureErrors = true, operation } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    <T,>(asyncFn: () => Promise<T>) => {
      return async (): Promise<T | undefined> => {
        setIsLoading(true);
        setError(null);

        try {
          const result = await asyncFn();
          onSuccess?.();
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          
          if (captureErrors) {
            reportError(error, {
              surface: "async_action",
              operation,
            });
          }
          
          onError?.(error);
          return undefined;
        } finally {
          setIsLoading(false);
        }
      };
    },
    [onSuccess, onError, captureErrors, operation],
  );

  return {
    isLoading,
    error,
    execute,
    reset,
  };
}
