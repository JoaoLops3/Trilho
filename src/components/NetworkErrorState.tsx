import { WifiOff, RefreshCcw } from "lucide-react";
import { motion } from "../lib/motion";

interface NetworkErrorStateProps {
  onRetry?: () => void;
  /**
   * Mensagem customizada. Se não fornecida, usa a padrão.
   */
  message?: string;
}

/**
 * Componente reutilizável para exibir erro de rede.
 * Útil em telas que dependem de sincronização com Supabase.
 * 
 * Uso:
 * ```tsx
 * {isNetworkError && <NetworkErrorState onRetry={refetch} />}
 * ```
 */
export function NetworkErrorState({
  onRetry,
  message = "Sem conexão com a internet",
}: NetworkErrorStateProps) {
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
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-obsidian-700/30"
      >
        <WifiOff className="h-8 w-8 text-obsidian-400" strokeWidth={1.5} />
      </motion.div>

      <h3 className="mb-2 font-display text-lg font-semibold text-white">
        {message}
      </h3>

      <p className="mb-4 text-sm text-obsidian-400 leading-relaxed">
        Verifique sua conexão e tente novamente. Seus dados locais estão
        seguros.
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
