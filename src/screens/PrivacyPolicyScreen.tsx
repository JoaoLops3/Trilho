import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { OrbBackground } from "../components/OrbBackground";
import { APP_NAME, SUPPORT_EMAIL } from "../lib/app-brand";

const LAST_UPDATED = "16 de julho de 2026";

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-glass p-5">
      <h2 className="m-0 text-xs font-medium uppercase tracking-wide text-obsidian-500">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm text-obsidian-200 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function PrivacyPolicyScreen() {
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
                Política de Privacidade
              </h1>
              <p className="text-obsidian-500 text-sm mt-1">
                Última atualização: {LAST_UPDATED}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-4"
            >
              <PolicySection title="Quais dados coletamos">
                <p className="m-0">
                  O {APP_NAME} coleta apenas o necessário para o app funcionar:
                </p>
                <ul className="m-0 list-disc space-y-1 pl-5">
                  <li>
                    <strong className="font-medium text-obsidian-100">
                      Dados de conta:
                    </strong>{" "}
                    seu email, usado para login e recuperação de senha.
                  </li>
                  <li>
                    <strong className="font-medium text-obsidian-100">
                      Dados do app:
                    </strong>{" "}
                    suas tarefas, histórico de dias, preferências e perfil (nome
                    e avatar), para sincronizar entre dispositivos.
                  </li>
                  <li>
                    <strong className="font-medium text-obsidian-100">
                      Dados de uso anônimos (opcional):
                    </strong>{" "}
                    eventos de uso do app coletados via PostHog, somente se você
                    consentir. Servem para entender o que funciona e melhorar o
                    produto.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection title="Como usamos os dados">
                <p className="m-0">
                  Usamos seus dados exclusivamente para operar o {APP_NAME}:
                  autenticar sua conta, salvar e sincronizar suas tarefas e
                  preferências, e — com seu consentimento — analisar o uso do
                  app de forma agregada para melhorá-lo.
                </p>
              </PolicySection>

              <PolicySection title="Compartilhamento">
                <p className="m-0">
                  Não vendemos seus dados a terceiros. Usamos apenas dois
                  provedores para operar o serviço: Supabase (armazenamento e
                  autenticação) e PostHog (análise de uso, apenas com seu
                  consentimento). Ambos processam os dados em nosso nome.
                </p>
              </PolicySection>

              <PolicySection title="Seus controles">
                <ul className="m-0 list-disc space-y-1 pl-5">
                  <li>
                    Você pode ativar ou desativar o compartilhamento de dados de
                    uso anônimos a qualquer momento em Perfil → Preferências.
                  </li>
                  <li>
                    Você pode excluir sua conta e todos os dados associados em
                    Perfil → Excluir conta. A exclusão é definitiva e remove
                    seus dados dos nossos servidores.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection title="Contato">
                <p className="m-0">
                  Dúvidas sobre privacidade ou seus dados? Fale com a gente:{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-mint-400 underline underline-offset-2"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
              </PolicySection>
            </motion.div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
