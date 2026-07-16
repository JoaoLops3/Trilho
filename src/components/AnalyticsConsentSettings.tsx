import { useState } from "react";
import { useHistory } from "react-router-dom";
import { motion } from "../lib/motion";
import { Shield } from "lucide-react";
import { getAnalyticsConsent, setAnalyticsConsent } from "../lib/posthog";
import { tabNavigationState } from "../lib/tab-navigation";
import { ToggleSwitch } from "./ToggleSwitch";

export function AnalyticsConsentSettings() {
  const history = useHistory();
  const [enabled, setEnabled] = useState(
    () => getAnalyticsConsent() === "granted",
  );

  const handleChange = (checked: boolean) => {
    setEnabled(checked);
    setAnalyticsConsent(checked);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="space-y-2"
    >
      <div className="px-1">
        <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-obsidian-500">
          <Shield className="h-4 w-4 shrink-0" strokeWidth={2} />
          Privacidade
        </p>
      </div>
      <div className="card-glass p-5">
        <div className="flex items-start justify-between gap-4 py-2 touch-manipulation">
          <span className="min-w-0">
            <span className="block text-sm text-obsidian-100">
              Compartilhar dados de uso anônimos
            </span>
            <span className="mt-0.5 block text-xs text-obsidian-500">
              Ajuda a melhorar o Trilho. Nada é vendido a terceiros. Saiba mais
              na{" "}
              <button
                type="button"
                onClick={() =>
                  history.push("/privacidade", tabNavigationState("profile"))
                }
                className="inline text-mint-400 underline underline-offset-2 touch-manipulation"
              >
                Política de Privacidade
              </button>
              .
            </span>
          </span>
          <ToggleSwitch
            checked={enabled}
            onChange={handleChange}
            aria-label="Compartilhar dados de uso anônimos"
          />
        </div>
      </div>
    </motion.section>
  );
}
