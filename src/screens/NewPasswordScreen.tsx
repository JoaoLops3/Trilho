import { useState, type FormEvent } from "react";
import { useHistory, Link } from "react-router-dom";
import { motion } from "../lib/motion";
import { AuthFormField } from "../components/AuthFormField";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useAuth } from "../lib/auth-context";
import { validateSignupPasswordConfirmation as validatePasswordConfirmation } from "../lib/auth-validation";

/**
 * Definir nova senha após o link de recovery (e-mail → iOS deep link / web).
 * Exige sessão de recuperação (`passwordRecoveryPending`).
 */
export function NewPasswordScreen() {
  const history = useHistory();
  const {
    updatePassword,
    passwordRecoveryPending,
    isAuthenticated,
    authConfigured,
    signOut,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const validationError = validatePasswordConfirmation(
      password,
      confirmPassword,
    );
    setFieldError(validationError);
    if (validationError) return;

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setFormError(error);
        return;
      }
      history.replace("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authConfigured) {
    return (
      <AuthScreenLayout
        title="Nova senha"
        subtitle="Supabase não configurado neste ambiente."
        showBack={false}
      >
        <div className="card-glass p-5 text-sm text-obsidian-400">
          Configure as variáveis Supabase no `.env` para redefinir a senha.
        </div>
      </AuthScreenLayout>
    );
  }

  if (!isAuthenticated || !passwordRecoveryPending) {
    return (
      <AuthScreenLayout
        title="Link inválido ou expirado"
        subtitle="Solicite um novo link de recuperação para definir a senha."
        onBack={() => history.replace("/login")}
      >
        <div className="card-glass space-y-4 p-5">
          <p className="text-sm text-obsidian-400">
            O link do e-mail só funciona uma vez e expira. Peça outro em
            recuperar senha.
          </p>
          <Link
            to="/recuperar-senha"
            className="btn-primary inline-flex w-full items-center justify-center touch-manipulation"
          >
            Recuperar senha
          </Link>
          <p className="text-center text-sm text-obsidian-500">
            <Link
              to="/login"
              className="font-medium text-mint-400 hover:text-mint-300 transition-colors"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Nova senha"
      subtitle="Escolha uma senha forte para voltar a entrar no Trilho."
      showBack={false}
    >
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={(e) => void handleSubmit(e)}
        className="card-glass space-y-4 p-5"
      >
        <AuthFormField
          id="new-password"
          label="Nova senha"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="••••••••"
          error={fieldError}
        />
        <AuthFormField
          id="new-password-confirm"
          label="Confirmar senha"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="••••••••"
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
          {isSubmitting ? "Salvando…" : "Salvar senha"}
        </button>

        <button
          type="button"
          onClick={() => {
            void signOut().then(() => {
              history.replace("/login");
              window.location.reload();
            });
          }}
          className="w-full text-center text-sm text-obsidian-500 hover:text-obsidian-300 transition-colors touch-manipulation py-2"
        >
          Cancelar e sair
        </button>
      </motion.form>
    </AuthScreenLayout>
  );
}
