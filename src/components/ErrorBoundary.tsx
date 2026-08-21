import { Component, ReactNode } from "react";
import { captureException } from "../lib/posthog";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Callback opcional quando um erro é capturado.
   * Útil para logging customizado ou side effects.
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /**
   * Componente customizado de fallback.
   * Se não fornecido, usa o ErrorFallback padrão.
   */
  fallback?: ReactNode;
  /**
   * Identificador do contexto onde o boundary está (ex: "dashboard", "profile").
   * Ajuda na depuração de onde o erro ocorreu.
   */
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - Captura erros React em qualquer lugar da árvore de componentes.
 * 
 * Uso:
 * ```tsx
 * <ErrorBoundary context="dashboard">
 *   <DashboardScreen />
 * </ErrorBoundary>
 * ```
 * 
 * Com fallback customizado:
 * ```tsx
 * <ErrorBoundary fallback={<MinhaTelaDeErro />}>
 *   <ComponentePerigoso />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { context, onError } = this.props;

    // Log do erro com contexto adicional
    console.error(
      `[ErrorBoundary${context ? ` - ${context}` : ""}]:`,
      error,
      errorInfo
    );

    // Envia para PostHog (analytics)
    captureException(error, {
      errorBoundaryContext: context,
      componentStack: errorInfo.componentStack,
    });

    // Callback customizado do consumidor
    onError?.(error, errorInfo);

    // Atualiza state com informações do erro
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, context } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          onReset={this.handleReset}
          context={context}
        />
      );
    }

    return children;
  }
}
