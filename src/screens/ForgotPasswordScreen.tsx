import { useState, type FormEvent } from "react";
import { useHistory, Link } from "react-router-dom";
import { motion } from "../lib/motion";
import { AuthFormField } from "../components/AuthFormField";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useAuth } from "../lib/auth-context";
import { validateAuthEmail as validateEmail } from "../lib/auth-validation";

export function ForgotPasswordScreen() {
  const history = useHistory();
  const { resetPassword, authConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const emailError = validateEmail(email);
    setFieldError(emailError);
    if (emailError) return;

    setIsSubmitting(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setFormError(error);
        return;
      }
      setSuccessMessage(
        "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authConfigured) {
    return (
      <AuthScreenLayout
        title="Recuperar senha"
        subtitle="Supabase não configurado neste ambiente."
        onBack={() => history.replace("/login")}
      >
        <div className="card-glass p-5 text-sm text-obsidian-400">
          Configure as variáveis Supabase no `.env` para usar recuperação de
          senha.
        </div>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link para redefinir sua senha."
      onBack={() => history.replace("/login")}
    >
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={(e) => void handleSubmit(e)}
        className="card-glass space-y-4 p-5"
      >
        <AuthFormField
          id="reset-email"
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="voce@email.com"
          error={fieldError}
        />

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

        <button
          type="submit"
          disabled={isSubmitting || Boolean(successMessage)}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
        >
          {isSubmitting ? "Enviando…" : "Enviar link"}
        </button>

        <p className="text-center text-sm text-obsidian-500 pt-1">
          <Link
            to="/login"
            className="font-medium text-mint-400 hover:text-mint-300 transition-colors"
          >
            Voltar ao login
          </Link>
        </p>
      </motion.form>
    </AuthScreenLayout>
  );
}
