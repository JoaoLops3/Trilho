import { motion } from "../lib/motion";

interface SpinnerProps {
  /**
   * Tamanho do spinner em pixels
   */
  size?: number;
  /**
   * Cor do spinner (classe Tailwind ou hex)
   */
  color?: string;
  /**
   * Label para leitores de tela
   */
  label?: string;
}

/**
 * Spinner minimalista com animação suave.
 * Usa motion.div para respeitar prefers-reduced-motion.
 * 
 * Uso:
 * ```tsx
 * <Spinner size={20} color="text-mint-400" label="Carregando tarefas" />
 * ```
 */
export function Spinner({
  size = 24,
  color = "text-mint-400",
  label = "Carregando",
}: SpinnerProps) {
  return (
    <motion.div
      role="status"
      aria-label={label}
      className="inline-block"
      style={{ width: size, height: size }}
    >
      <motion.svg
        className={color}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="32 16"
          opacity="0.25"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="15 33"
        />
      </motion.svg>
      <span className="sr-only">{label}</span>
    </motion.div>
  );
}

/**
 * Spinner inline para usar dentro de texto ou botões.
 * Tamanho pequeno e alinhamento vertical automático.
 */
export function InlineSpinner({ label = "Carregando" }: { label?: string }) {
  return (
    <Spinner
      size={16}
      color="currentColor"
      label={label}
    />
  );
}
