import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { OrbBackground } from "../components/OrbBackground";
import { AuthFormField } from "../components/AuthFormField";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import {
  validateAuthEmail as validateEmail,
  validateLoginPassword as validatePassword,
} from "../lib/auth-validation";

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  onBack,
  showBack = true,
}: AuthScreenLayoutProps) {
  const history = useHistory();
  const keyboardInset = useKeyboardInset(true);
  const keyboardOpen = keyboardInset > 0;

  return (
    <IonPage>
      <IonContent
        scrollY
        forceOverscroll={false}
        className="ion-content-custom ion-content-auth ion-content-auth-scrollable"
      >
        <OrbBackground />

        <div
          className="relative z-10 min-h-full pb-12 md:mx-auto md:max-w-xl"
          style={
            keyboardOpen
              ? {
                  paddingBottom: `calc(${keyboardInset}px + 3rem + env(safe-area-inset-bottom, 0px))`,
                  transition: "padding-bottom 0.25s ease-out",
                }
              : undefined
          }
        >
          <div className="px-4 pt-safe pb-2 space-y-6">
            {showBack ? (
              <button
                type="button"
                onClick={onBack ?? (() => history.goBack())}
                className="inline-flex items-center gap-1 text-sm text-obsidian-400 hover:text-white transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                Voltar
              </button>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-2"
            >
              <h1 className="font-display font-semibold text-2xl text-white tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-obsidian-500">{subtitle}</p>
            </motion.div>

            {children}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

interface AuthFormProps {
  submitLabel: string;
  loadingLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: ReactNode;
}

export function AuthEmailPasswordForm({
  submitLabel,
  loadingLabel,
  onSubmit,
  footer,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFieldErrors({
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    });
    if (emailError || passwordError) return;

    setIsSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      onSubmit={(e) => void handleSubmit(e)}
      className="card-glass space-y-4 p-5"
    >
      <AuthFormField
        id="auth-email"
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder="voce@email.com"
        error={fieldErrors.email}
      />
      <AuthFormField
        id="auth-password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder="••••••••"
        error={fieldErrors.password}
      />

      {formError ? (
        <p className="text-sm text-coral-400" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
      >
        {isSubmitting ? loadingLabel : submitLabel}
      </button>

      {footer}
    </motion.form>
  );
}
