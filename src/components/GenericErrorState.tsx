import { AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "../lib/motion";

interface GenericErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /**
   * Se true, exibe layout compacto (útil em cards pequenos)
   */
  compact?: boolean;
}

/**
 * Estado de erro genérico reutilizável para qualquer situação.
 * Pode ser usado inline em cards, modais ou telas inteiras.
 * 
 * Uso:
 * ```tsx
 * {error && (
 *   <GenericErrorState
 *     title="Falha ao carregar"
 *     message={error.message}
 *     onRetry={refetch}
 *   />
 * )}
 * ```
 */
export function GenericErrorState({
  title = "Algo deu errado",
  message = "Não foi possível completar a operação. Tente novamente.",
  onRetry,
  compact = false,
}: GenericErrorStateProps) {
  if (compact) {
    return (
      <div className="card-glass p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertCircle
            className="h-5 w-5 text-coral-400"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-white">{title}</p>
        </div>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-mint-400 hover:text-mint-300 transition-colors flex items-center gap-1 mx-auto"
          >
            <RefreshCcw className="h-3.5 w-3.5" strokeWidth={2} />
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-coral-500/20"
      >
        <AlertCircle className="h-8 w-8 text-coral-400" strokeWidth={1.5} />
      </motion.div>

      <h3 className="mb-2 font-display text-lg font-semibold text-white">
        {title}
      </h3>

      <p className="mb-4 text-sm text-obsidian-400 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary mx-auto flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" strokeWidth={2} />
          Tentar novamente
        </button>
      )}
    </motion.div>
  );
}
