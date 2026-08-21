import { IonPage, IonContent } from "@ionic/react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { useHistory } from "react-router-dom";
import { motion } from "../lib/motion";

interface ErrorFallbackProps {
  error: Error;
  onReset?: () => void;
  context?: string;
}

/**
 * Tela de erro amigável exibida quando um ErrorBoundary captura uma exceção.
 * Oferece opções de recuperação (tentar novamente, voltar à home).
 */
export function ErrorFallback({ error, onReset, context }: ErrorFallbackProps) {
  const history = useHistory();

  const handleGoHome = () => {
    if (onReset) {
      onReset();
    }
    history.push("/");
  };

  const handleRetry = () => {
    if (onReset) {
      onReset();
    } else {
      // Fallback: recarrega a página se não houver callback de reset
      window.location.reload();
    }
  };

  // Mensagem amigável baseada no tipo de erro
  const getUserMessage = (err: Error): string => {
    const message = err.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "Parece que você está sem conexão. Verifique sua internet e tente novamente.";
    }

    if (message.includes("timeout")) {
      return "A operação demorou muito. Tente novamente em alguns instantes.";
    }

    if (message.includes("not found") || message.includes("404")) {
      return "Não conseguimos encontrar o que você estava procurando.";
    }

    if (message.includes("permission") || message.includes("unauthorized")) {
      return "Você não tem permissão para acessar isso. Tente fazer login novamente.";
    }

    // Mensagem genérica para outros erros
    return "Algo deu errado por aqui. Estamos trabalhando para resolver.";
  };

  const userMessage = getUserMessage(error);
  const isDevelopment = import.meta.env.DEV;

  return (
    <IonPage>
      <IonContent className="ion-padding" scrollY={false}>
        <div className="flex h-full flex-col items-center justify-center px-6 md:mx-auto md:max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Ícone de erro */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coral-500/20"
            >
              <AlertCircle
                className="h-10 w-10 text-coral-400"
                strokeWidth={1.5}
              />
            </motion.div>

            {/* Mensagem principal */}
            <h1 className="mb-3 text-center font-display text-2xl font-semibold text-white">
              Ops! Algo não saiu como esperado
            </h1>

            <p className="mb-6 text-center text-base text-obsidian-300 leading-relaxed">
              {userMessage}
            </p>

            {/* Detalhes técnicos (apenas em desenvolvimento) */}
            {isDevelopment && (
              <details className="mb-6 card-premium p-4">
                <summary className="cursor-pointer text-sm font-medium text-obsidian-400 mb-2">
                  Detalhes técnicos (dev only)
                </summary>
                <div className="space-y-2">
                  {context && (
                    <div className="text-xs">
                      <span className="text-obsidian-500">Contexto:</span>
                      <span className="ml-2 text-mint-400">{context}</span>
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="text-obsidian-500">Erro:</span>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-obsidian-900 p-2 text-coral-400">
                      {error.message}
                    </pre>
                  </div>
                  {error.stack && (
                    <div className="text-xs">
                      <span className="text-obsidian-500">Stack:</span>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-obsidian-900 p-2 text-obsidian-400 text-[10px]">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Ações de recuperação */}
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-5 w-5" strokeWidth={2} />
                Tentar novamente
              </button>

              <button
                onClick={handleGoHome}
                className="btn-ghost w-full flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" strokeWidth={1.5} />
                Voltar ao início
              </button>
            </div>

            {/* Mensagem de suporte */}
            <p className="mt-6 text-center text-sm text-obsidian-500">
              Se o problema persistir, entre em contato pelo{" "}
              <a
                href="mailto:support@example.com"
                className="text-mint-400 hover:underline"
              >
                suporte
              </a>
              .
            </p>
          </motion.div>
        </div>
      </IonContent>
    </IonPage>
  );
}
