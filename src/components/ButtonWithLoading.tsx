import { type ReactNode } from "react";
import { motion } from "../lib/motion";
import { InlineSpinner } from "./Spinner";

interface ButtonWithLoadingProps {
  /**
   * Conteúdo do botão (texto ou ícones)
   */
  children: ReactNode;
  /**
   * Estado de loading - desabilita e mostra spinner
   */
  isLoading?: boolean;
  /**
   * Desabilitado (independente de loading)
   */
  disabled?: boolean;
  /**
   * Variante visual do botão
   */
  variant?: "primary" | "ghost" | "outline" | "danger";
  /**
   * Tamanho do botão
   */
  size?: "sm" | "md" | "lg";
  /**
   * Largura total
   */
  fullWidth?: boolean;
  /**
   * Tipo do botão
   */
  type?: "button" | "submit" | "reset";
  /**
   * Handler de clique
   */
  onClick?: () => void;
  /**
   * Classes adicionais
   */
  className?: string;
  /**
   * Label para o estado de loading (acessibilidade)
   */
  loadingLabel?: string;
}

const variantClasses = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  outline:
    "font-medium rounded-2xl px-6 py-3 transition-all duration-200 border border-white/10 bg-transparent text-obsidian-300 hover:bg-white/[0.05] hover:text-white active:scale-[0.98]",
  danger:
    "font-medium rounded-2xl px-6 py-3 transition-all duration-200 bg-coral-500/20 text-coral-400 hover:bg-coral-500/30 active:scale-[0.98]",
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

/**
 * Botão reutilizável com suporte a loading state.
 * Exibe spinner automaticamente quando isLoading=true.
 * 
 * Uso:
 * ```tsx
 * <ButtonWithLoading
 *   variant="primary"
 *   isLoading={isSubmitting}
 *   onClick={handleSubmit}
 * >
 *   Salvar
 * </ButtonWithLoading>
 * ```
 */
export function ButtonWithLoading({
  children,
  isLoading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  onClick,
  className = "",
  loadingLabel = "Processando",
}: ButtonWithLoadingProps) {
  const isDisabled = disabled || isLoading;
  
  // Combina classes base com variante e tamanho
  const baseClasses = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = isDisabled
    ? "cursor-not-allowed opacity-50"
    : "";

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={`${baseClasses} ${sizeClass} ${widthClass} ${disabledClass} ${className} touch-manipulation inline-flex items-center justify-center gap-2`}
      aria-busy={isLoading}
      aria-label={isLoading ? loadingLabel : undefined}
    >
      {isLoading ? (
        <>
          <InlineSpinner label={loadingLabel} />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
