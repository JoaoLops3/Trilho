import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import { Cloud, CloudOff, RefreshCcw } from "lucide-react";
import { useSync } from "../lib/sync-context";
import { useAuth } from "../lib/auth-context";

/**
 * Indicador discreto de status de sincronização.
 * Aparece temporariamente durante sync ativo ou quando offline.
 *
 * Estados:
 * - Sincronizando: ícone de nuvem rotacionando
 * - Offline: ícone de nuvem desconectada (estático)
 * - Sincronizado: não exibe nada (ou exibe por 2s após sync)
 *
 * Uso:
 * ```tsx
 * <SyncStatusIndicator />
 * ```
 */
export function SyncStatusIndicator() {
  const { session } = useAuth();
  const { isSyncing, isApplyingRemote } = useSync();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Só exibe se estiver logado
  if (!session) return null;

  const isActive = isSyncing || isApplyingRemote;
  const showOffline = !isOnline && !isActive;
  const shouldShow = isActive || showOffline;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-safe left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-xl ${
              showOffline
                ? "bg-coral-400/15 border-coral-400/30"
                : "bg-mint-400/15 border-mint-400/30"
            }`}
          >
            {showOffline ? (
              <>
                <CloudOff
                  className="h-3.5 w-3.5 text-coral-400"
                  strokeWidth={2}
                />
                <span className="text-coral-400">Offline</span>
              </>
            ) : (
              <>
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
              </>
            )}
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
