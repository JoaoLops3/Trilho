import { motion, AnimatePresence } from "../lib/motion";
import { Cloud, RefreshCcw } from "lucide-react";
import { useSync } from "../lib/sync-context";
import { useAuth } from "../lib/auth-context";

/**
 * Indicador discreto de status de sincronização.
 * Aparece temporariamente durante sync ativo.
 * Offline com retry: OfflineNetworkBanner (NetworkErrorState).
 *
 * Uso:
 * ```tsx
 * <SyncStatusIndicator />
 * ```
 */
export function SyncStatusIndicator() {
  const { session } = useAuth();
  const { isSyncing, isApplyingRemote } = useSync();

  // Offline com retry fica no OfflineNetworkBanner (NetworkErrorState).
  // Aqui só feedback de sync ativo — evita chip e banner competindo.
  if (!session) return null;

  const isActive = isSyncing || isApplyingRemote;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-safe left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-full border border-mint-400/30 bg-mint-400/15 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <RefreshCcw
                className="h-3.5 w-3.5 text-mint-400"
                strokeWidth={2}
              />
            </motion.div>
            <span className="text-mint-400">
              {isApplyingRemote ? "Aplicando" : "Sincronizando"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Variante compacta para usar em headers ou cards.
 * Apenas o ícone, sem texto.
 */
export function SyncStatusIcon() {
  const { session } = useAuth();
  const { isSyncing, isApplyingRemote } = useSync();

  if (!session) return null;

  const isActive = isSyncing || isApplyingRemote;

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: 360 }}
      exit={{ scale: 0 }}
      transition={{
        scale: { duration: 0.2 },
        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
      }}
      className="inline-flex"
      aria-label="Sincronizando com a nuvem"
    >
      <Cloud className="h-4 w-4 text-mint-400" strokeWidth={2} />
    </motion.div>
  );
}
