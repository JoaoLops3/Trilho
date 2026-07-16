import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { OrbBackground } from "../components/OrbBackground";
import { DailyGoalSettings } from "../components/DailyGoalSettings";
import { NotificationPreferencesForm } from "../components/NotificationPreferencesForm";
import { AnalyticsConsentSettings } from "../components/AnalyticsConsentSettings";

export function SettingsScreen() {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent scrollY={true} className="ion-content-custom">
        <OrbBackground />

        <div className="relative z-10 min-h-screen pb-32 md:mx-auto md:max-w-xl">
          <div className="px-4 pt-safe pb-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.button
                type="button"
                onClick={() => history.goBack()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-obsidian-200 transition-colors hover:bg-surface-tertiary touch-manipulation"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </motion.button>

              <h1 className="mt-3 mb-0 font-display font-semibold text-2xl text-white tracking-tight">
                Preferências
              </h1>
              <p className="text-obsidian-500 text-sm mt-1">
                Configure alertas, metas e outras opções do app.
              </p>
            </motion.div>

            <DailyGoalSettings />

            <NotificationPreferencesForm />

            <AnalyticsConsentSettings />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
