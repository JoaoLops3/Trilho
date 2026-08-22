import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "../lib/motion";
import { useAuth } from "../lib/auth-context";
import { useSync } from "../lib/sync-context";
import { NetworkErrorState } from "./NetworkErrorState";

/**
 * Banner acionável quando a sessão está autenticada e o aparelho fica offline.
 * Usa NetworkErrorState (já existia) no fluxo real — retry dispara refresh na nuvem.
 */
export function OfflineNetworkBanner() {
  const { session } = useAuth();
  const { refreshFromCloud, isSyncing } = useSync();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

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

  const shouldShow = Boolean(session) && !isOnline;

  return (
    <AnimatePresence>
      {shouldShow ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-tab-bar"
          role="region"
          aria-label="Status da conexão"
        >
          <NetworkErrorState
            message="Sem conexão com a internet"
            onRetry={
              isSyncing
                ? undefined
                : () => {
                    void refreshFromCloud();
                  }
            }
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
