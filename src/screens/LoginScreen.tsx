import { useEffect, useState, type FormEvent } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { OrbBackground } from "../components/OrbBackground";
import { AppLogo } from "../components/AppLogo";
import { AuthFormField } from "../components/AuthFormField";
import { ButtonWithLoading } from "../components/ButtonWithLoading";
import { useAuth } from "../lib/auth-context";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { APP_NAME, APP_TAGLINE, APP_VERSION } from "../lib/app-brand";
import {
  validateDisplayName,
  validateAuthEmail as validateEmail,
  validateLoginPassword as validatePassword,
  validateSignupPasswordConfirmation as validatePasswordConfirmation,
} from "../lib/auth-validation";

type AuthMode = "login" | "signup";

function AuthModeTabs({
  mode,
  onChange,
}: {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}) {
  return (
    <div
      className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/10"
      role="tablist"
      aria-label="Tipo de acesso"
    >
      {(
        [
          { id: "login" as const, label: "Entrar" },
          { id: "signup" as const, label: "Criar conta" },
        ] as const
      ).map(({ id, label }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all touch-manipulation ${
              isActive
                ? "bg-white/10 text-white shadow-sm font-display"
                : "text-obsidian-400 hover:text-obsidian-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function LoginScreen() {
  const history = useHistory();
  const location = useLocation();
  const { signIn, signUp, authConfigured } = useAuth();

  const queryMode = new URLSearchParams(location.search).get("mode");
  const [mode, setMode] = useState<AuthMode>(
    queryMode === "cadastro" ? "signup" : "login",
  );
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (queryMode === "cadastro") setMode("signup");
  }, [queryMode]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setFormError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setDisplayName("");
    history.replace(next === "signup" ? "/login?mode=cadastro" : "/login");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const emailError = validateEmail(email);
    const displayNameError =
      mode === "signup" ? validateDisplayName(displayName) : null;
    const passwordError =
      mode === "signup"
        ? validatePasswordConfirmation(password, confirmPassword)
        : validatePassword(password);

    setFieldErrors({
      displayName: displayNameError ?? undefined,
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
      confirmPassword:
        mode === "signup" ? (passwordError ?? undefined) : undefined,
    });

    if (emailError || displayNameError || passwordError) return;

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setFormError(error);
          return;
        }
        history.replace("/");
        return;
      }

      const { error, needsEmailConfirmation } = await signUp(
        email,
        password,
        displayName,
      );
      if (error) {
        setFormError(error);
        return;
      }

      if (needsEmailConfirmation) {
        setSuccessMessage(
          "Conta criada! Verifique seu e-mail para confirmar antes de entrar.",
        );
        return;
      }

      history.replace("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = mode === "login" ? "Entrar" : "Criar conta";
  const loadingLabel = mode === "login" ? "Entrando" : "Criando conta";

  const keyboardInset = useKeyboardInset(true);
  const keyboardOpen = keyboardInset > 0;

  return (
    <IonPage>
      <IonContent
        scrollY={keyboardOpen}
        forceOverscroll={false}
        className={`ion-content-custom ion-content-auth${
          keyboardOpen ? " ion-content-auth-scrollable" : ""
        }`}
      >
        <OrbBackground />

        <div
          className={`relative z-10 flex min-h-full flex-col px-5 pt-safe md:mx-auto md:max-w-md ${
            keyboardOpen
              ? "justify-start"
              : "h-full justify-center overflow-hidden pb-safe"
          }`}
          style={
            keyboardOpen
              ? {
                  paddingBottom: `calc(${keyboardInset}px + env(safe-area-inset-bottom, 0px))`,
                  transition: "padding-bottom 0.25s ease-out",
                }
              : undefined
          }
        >
          <div className="flex flex-col">
            <motion.header
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center text-center pb-5"
            >
              <motion.div
                className="mb-5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AppLogo size={64} />
              </motion.div>
              <h1 className="font-display font-bold text-3xl text-white tracking-tight">
                {APP_NAME}
              </h1>
              <p className="mt-2 text-sm text-obsidian-400 max-w-[260px] leading-relaxed">
                {APP_TAGLINE}
              </p>
            </motion.header>

            {!authConfigured ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-glass p-5 space-y-4 text-center"
              >
                <p className="text-sm text-obsidian-400 leading-relaxed">
                  Conta na nuvem não configurada neste ambiente. Você pode
                  continuar usando o app localmente.
                </p>
                <button
                  type="button"
                  onClick={() => history.replace("/")}
                  className="btn-primary w-full touch-manipulation"
                >
                  Continuar sem conta
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="flex flex-col"
              >
                <AuthModeTabs mode={mode} onChange={switchMode} />

                <form
                  onSubmit={(e) => void handleSubmit(e)}
                  className="card-glass mt-4 space-y-4 p-5"
                >
                  <AnimatePresence mode="wait">
                    {mode === "signup" ? (
                      <motion.div
                        key="name"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AuthFormField
                          id="welcome-name"
                          label="Nome"
                          type="text"
                          value={displayName}
                          onChange={setDisplayName}
                          autoComplete="name"
                          placeholder="Como quer ser chamado?"
                          error={fieldErrors.displayName}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AuthFormField
                    id="welcome-email"
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    placeholder="voce@email.com"
                    error={fieldErrors.email}
                  />
                  <AuthFormField
                    id="welcome-password"
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    placeholder={
                      mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"
                    }
                    error={fieldErrors.password}
                  />

                  <AnimatePresence mode="wait">
                    {mode === "signup" ? (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AuthFormField
                          id="welcome-confirm-password"
                          label="Confirmar senha"
                          type="password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          autoComplete="new-password"
                          placeholder="Repita a senha"
                          error={fieldErrors.confirmPassword}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {formError ? (
                    <p className="text-sm text-coral-400" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  {successMessage ? (
                    <p className="text-sm text-mint-400" role="status">
                      {successMessage}
                    </p>
                  ) : null}

                  <ButtonWithLoading
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    disabled={Boolean(successMessage)}
                    loadingLabel={loadingLabel}
                  >
                    {submitLabel}
                  </ButtonWithLoading>

                  {mode === "login" ? (
                    <p className="text-center text-sm pt-1">
                      <Link
                        to="/recuperar-senha"
                        className="text-obsidian-400 hover:text-white transition-colors"
                      >
                        Esqueci minha senha
                      </Link>
                    </p>
                  ) : null}
                </form>
              </motion.div>
            )}

            <p className="mt-6 text-center text-xs text-obsidian-500">
              Versão {APP_VERSION}
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
