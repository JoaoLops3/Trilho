/**
 * Utilitários para gerenciar focus de forma acessível.
 * 
 * Este arquivo contém helpers para navegação por teclado,
 * gestão de focus trap e restauração de focus.
 */

/**
 * Move o focus para o primeiro elemento focável dentro de um container.
 * Útil para modais, sheets e dialogs.
 * 
 * @param container - Elemento container (ex: modal)
 * @param options - Opções de foco
 * 
 * Uso:
 * ```tsx
 * useEffect(() => {
 *   if (isOpen) {
 *     focusFirstElement(modalRef.current);
 *   }
 * }, [isOpen]);
 * ```
 */
export function focusFirstElement(
  container: HTMLElement | null,
  options: {
    /** Seletor customizado para elementos focáveis */
    selector?: string;
    /** Delay antes de focar (útil para animações) */
    delay?: number;
  } = {}
): void {
  if (!container) return;

  const { selector, delay = 0 } = options;

  const defaultSelector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableSelector = selector || defaultSelector;

  const focus = () => {
    const firstFocusable = container.querySelector<HTMLElement>(
      focusableSelector
    );
    firstFocusable?.focus();
  };

  if (delay > 0) {
    setTimeout(focus, delay);
  } else {
    focus();
  }
}

/**
 * Retorna todos os elementos focáveis dentro de um container.
 * Útil para criar focus trap customizado.
 */
export function getFocusableElements(
  container: HTMLElement | null
): HTMLElement[] {
  if (!container) return [];

  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="tab"]:not([disabled])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Cria um focus trap para manter o foco dentro de um container.
 * Quando o usuário chega ao último elemento e pressiona Tab,
 * o foco volta para o primeiro elemento (e vice-versa com Shift+Tab).
 * 
 * Retorna uma função de cleanup para remover os event listeners.
 * 
 * Uso:
 * ```tsx
 * useEffect(() => {
 *   if (isOpen && modalRef.current) {
 *     return createFocusTrap(modalRef.current);
 *   }
 * }, [isOpen]);
 * ```
 */
export function createFocusTrap(
  container: HTMLElement | null
): (() => void) | undefined {
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    // Shift + Tab: volta do primeiro para o último
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab: vai do último para o primeiro
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Foca o primeiro elemento ao criar o trap
  focusFirstElement(container, { delay: 100 });

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Salva o elemento atualmente focado e retorna uma função
 * para restaurar o foco nele posteriormente.
 * 
 * Útil para modais que devem devolver o foco ao elemento
 * que os abriu quando fechados.
 * 
 * Uso:
 * ```tsx
 * const restoreFocus = useMemo(() => saveFocus(), []);
 * 
 * useEffect(() => {
 *   if (!isOpen) {
 *     restoreFocus();
 *   }
 * }, [isOpen, restoreFocus]);
 * ```
 */
export function saveFocus(): () => void {
  const previouslyFocused = document.activeElement as HTMLElement;

  return () => {
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      // Pequeno delay para garantir que o modal foi removido do DOM
      setTimeout(() => {
        previouslyFocused.focus();
      }, 50);
    }
  };
}

/**
 * Hook React para criar focus trap automaticamente.
 * Combina createFocusTrap com saveFocus.
 * 
 * Uso:
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   useFocusTrap(modalRef, isOpen);
 *   
 *   return <div ref={modalRef}>...</div>;
 * }
 * ```
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
): void {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const restoreFocus = saveFocus();
    const cleanup = createFocusTrap(containerRef.current);

    return () => {
      cleanup?.();
      restoreFocus();
    };
  }, [isActive, containerRef]);
}

// Para uso sem importar React
import * as React from 'react';

/**
 * Classes CSS utilitárias para focus personalizado.
 * Use em conjunto com Tailwind.
 */
export const focusClasses = {
  /** Focus padrão (mint) */
  default: 'focus-visible:outline-mint-400 focus-visible:outline-2 focus-visible:outline-offset-2',
  
  /** Focus em botões primários */
  primary: 'focus-visible:outline-mint-500 focus-visible:outline-2 focus-visible:ring-4 focus-visible:ring-mint-400/25',
  
  /** Focus em links */
  link: 'focus-visible:outline-mint-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-sm',
  
  /** Focus em cards interativos */
  card: 'focus-visible:outline-mint-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-4 focus-visible:ring-mint-400/15',
  
  /** Focus em inputs */
  input: 'focus-visible:outline-mint-400 focus-visible:outline-2 focus-visible:ring-3 focus-visible:ring-mint-400/20',
} as const;
