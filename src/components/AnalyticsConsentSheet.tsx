import { useState } from "react";
import { createPortal } from "react-dom";
import { useHistory, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "../lib/motion";
import { BarChart } from "lucide-react";
import { isAuthRoute } from "../lib/auth-context";
import {
  captureEvent,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from "../lib/posthog";
import { resolveActiveTab, tabNavigationState } from "../lib/tab-navigation";

/**
 * Pergunta uma única vez se o usuário aceita compartilhar dados de uso
 * anônimos (PostHog). Enquanto não houver resposta explícita, nada é coletado;
 * fechar pelo backdrop mantém a pergunta para a próxima sessão.
 */
export function AnalyticsConsentSheet() {
  const history = useHistory();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => getAnalyticsConsent() === null);

  const visible = isOpen && !isAuthRoute(location.pathname);

  const handleAccept = () => {
    setAnalyticsConsent(true);
    captureEvent("analytics consent granted");
    setIsOpen(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setIsOpen(false);
  };

  const handleOpenPolicy = () => {
    setIsOpen(false);
    history.push(
      "/privacidade",
      tabNavigationState(resolveActiveTab(location.pathname, undefined)),
    );
  };

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            className="relative z-10 w-full max-w-xl rounded-t-[28px] border border-white/10 bg-[#14141c] px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-500/10 border border-mint-500/20">
                <BarChart className="h-5 w-5 text-mint-400" />
              </div>
              <h2 className="m-0 font-display text-xl font-semibold text-white">
                Ajude a melhorar o Trilho
              </h2>
            </div>

            <p className="mt-3 text-sm text-obsidian-400 leading-relaxed">
              Podemos coletar dados de uso anônimos (quais telas e recursos você
              usa) para entender o que funciona e melhorar o app? Nada é vendido
              a terceiros e você pode mudar de ideia a qualquer momento em
              Preferências.{" "}
              <button
                type="button"
                onClick={handleOpenPolicy}
                className="inline text-mint-400 underline underline-offset-2 touch-manipulation"
              >
                Política de Privacidade
              </button>
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAccept}
                className="w-full rounded-2xl border border-mint-500/30 bg-mint-500/10 py-3.5 text-sm font-medium text-mint-400 transition-colors hover:bg-mint-500/20 touch-manipulation"
              >
                Aceitar
              </button>

              <button
                type="button"
                onClick={handleDecline}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-medium text-obsidian-300 transition-colors hover:bg-white/[0.08] touch-manipulation"
              >
                Agora não
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
