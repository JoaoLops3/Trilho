import { motion, AnimatePresence } from "../lib/motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-mint-400",
    bg: "bg-mint-500/15",
    border: "border-mint-500/30",
  },
  error: {
    icon: AlertCircle,
    color: "text-coral-400",
    bg: "bg-coral-500/15",
    border: "border-coral-500/30",
  },
  warning: {
    icon: AlertCircle,
    color: "text-electric-400",
    bg: "bg-electric-500/15",
    border: "border-electric-500/30",
  },
  info: {
    icon: Info,
    color: "text-obsidian-300",
    bg: "bg-obsidian-500/15",
    border: "border-obsidian-500/30",
  },
};

/**
 * Componente individual de toast.
 * Não use diretamente - use o ToastContainer e hook useToast.
 */
export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration === Infinity) return;

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-start gap-3 rounded-2xl border ${config.border} ${config.bg} px-4 py-3 shadow-lg backdrop-blur-xl max-w-md w-full`}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <Icon
        className={`${config.color} h-5 w-5 flex-shrink-0 mt-0.5`}
        strokeWidth={2}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white leading-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-xs text-obsidian-300 leading-relaxed">
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-xs font-medium text-mint-400 hover:text-mint-300 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4 text-obsidian-400" strokeWidth={2} />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  /**
   * Posição dos toasts na tela
   */
  position?: "top" | "bottom" | "top-center" | "bottom-center";
}

/**
 * Container que renderiza todos os toasts ativos.
 * Posiciona os toasts na tela e gerencia animações.
 */
export function ToastContainer({
  toasts,
  onDismiss,
  position = "top",
}: ToastContainerProps) {
  const positionClasses = {
    top: "top-4 right-4 items-end",
    bottom: "bottom-4 right-4 items-end",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  return (
    <div
      className={`fixed z-[100] flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
      style={{
        paddingTop: position.includes("top")
          ? "calc(env(safe-area-inset-top, 0px) + 1rem)"
          : undefined,
        paddingBottom: position.includes("bottom")
          ? "calc(env(safe-area-inset-bottom, 0px) + 1rem)"
          : undefined,
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
