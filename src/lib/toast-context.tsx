import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ToastContainer, type Toast, type ToastType } from "../components/Toast";

interface ToastContextValue {
  toasts: Toast[];
  showToast: (
    type: ToastType,
    title: string,
    options?: {
      message?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  /**
   * Helpers para tipos específicos de toast
   */
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Provider de toasts. Adicione no topo da árvore de componentes.
 * 
 * Uso:
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      options?: {
        message?: string;
        duration?: number;
        action?: { label: string; onClick: () => void };
      }
    ): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      const toast: Toast = {
        id,
        type,
        title,
        message: options?.message,
        duration: options?.duration,
        action: options?.action,
      };

      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Helpers para tipos específicos
  const success = useCallback(
    (title: string, message?: string) => {
      return showToast("success", title, { message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      return showToast("error", title, { message });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      return showToast("info", title, { message });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      return showToast("warning", title, { message });
    },
    [showToast]
  );

  const value: ToastContextValue = {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} position="top" />
    </ToastContext.Provider>
  );
}

/**
 * Hook para usar o sistema de toasts.
 * 
 * Uso:
 * ```tsx
 * const toast = useToast();
 * 
 * // Toasts simples
 * toast.success('Tarefa salva!');
 * toast.error('Falha ao salvar');
 * toast.info('Sincronizando…');
 * toast.warning('Dados não salvos');
 * 
 * // Toast com mensagem adicional
 * toast.success('Tarefa concluída', 'Parabéns! Continue assim.');
 * 
 * // Toast customizado com ação
 * toast.showToast('success', 'Tarefa deletada', {
 *   message: 'A tarefa foi removida',
 *   duration: 8000,
 *   action: {
 *     label: 'Desfazer',
 *     onClick: () => restoreTask(),
 *   },
 * });
 * 
 * // Dismissar manualmente
 * const id = toast.success('Salvando…');
 * setTimeout(() => toast.dismissToast(id), 2000);
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
}

/**
 * Hook para criar toasts de feedback de ações assíncronas.
 * Automaticamente exibe loading, success ou error.
 * 
 * Uso:
 * ```tsx
 * const toastAsync = useToastAsync();
 * 
 * await toastAsync(
 *   async () => {
 *     await api.saveTask(task);
 *   },
 *   {
 *     loading: 'Salvando tarefa…',
 *     success: 'Tarefa salva com sucesso!',
 *     error: 'Falha ao salvar tarefa',
 *   }
 * );
 * ```
 */
export function useToastAsync() {
  const toast = useToast();

  return async <T,>(
    asyncFn: () => Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    }
  ): Promise<T | undefined> => {
    let loadingToastId: string | undefined;

    try {
      if (messages.loading) {
        loadingToastId = toast.info(messages.loading, undefined);
      }

      const result = await asyncFn();

      if (loadingToastId) {
        toast.dismissToast(loadingToastId);
      }

      if (messages.success) {
        toast.success(messages.success);
      }

      return result;
    } catch (err) {
      if (loadingToastId) {
        toast.dismissToast(loadingToastId);
      }

      const errorMessage =
        messages.error ||
        (err instanceof Error ? err.message : "Erro desconhecido");

      toast.error(errorMessage);
      return undefined;
    }
  };
}
