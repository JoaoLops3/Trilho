import { Capacitor } from "@capacitor/core";
import {
  AnimatePresence,
  LazyMotion,
  domMax,
  m,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";

const loadFeatures = () => Promise.resolve(domMax);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}

/** Alias de `m` para uso com LazyMotion (carrega domMax sob demanda). */
export const motion = m;

export { AnimatePresence, useReducedMotion };

export function shouldRenderOrbBackground(): boolean {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hook para verificar se o usuário prefere animações reduzidas.
 * Wrapper do useReducedMotion do Framer Motion.
 * 
 * Uso:
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 * const duration = prefersReducedMotion ? 0 : 0.3;
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/**
 * Cria uma transition que se adapta ao prefers-reduced-motion.
 * Quando o usuário prefere animações reduzidas, a duração é reduzida drasticamente.
 * 
 * Uso:
 * ```tsx
 * <motion.div transition={createA11yTransition({ duration: 0.3, delay: 0.1 })}>
 * ```
 */
export function createA11yTransition(
  baseTransition: Transition,
  reducedDuration = 0.15
): Transition {
  if (typeof window === "undefined") return baseTransition;
  
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  
  if (prefersReduced) {
    return {
      ...baseTransition,
      duration: reducedDuration,
      delay: 0, // Remove delays quando reduced motion está ativo
    };
  }
  
  return baseTransition;
}

/**
 * Filtra propriedades de animação para manter apenas opacity e transformações mínimas.
 * Remove x, y, scale, rotate quando reduced motion está ativo.
 */
function filterAccessibleAnimation(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  
  // Mantém apenas opacity (não causa náusea)
  if ("opacity" in value) {
    return { opacity: (value as Record<string, unknown>).opacity };
  }
  
  return undefined;
}

/**
 * Cria variants adaptadas para acessibilidade.
 * Remove animações de movimento quando reduced motion está ativo,
 * mantendo apenas transições de opacidade.
 * 
 * Uso:
 * ```tsx
 * const variants = createA11yVariants({
 *   hidden: { opacity: 0, y: 20 },
 *   visible: { opacity: 1, y: 0 },
 * });
 * ```
 */
export function createA11yVariants<T extends Variants>(
  variants: T,
  options: { keepOpacity?: boolean } = { keepOpacity: true }
): T {
  if (typeof window === "undefined") return variants;
  
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  
  if (!prefersReduced) return variants;
  
  // Se o usuário prefere animações reduzidas, filtra cada variant
  const accessibleVariants: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(variants)) {
    if (typeof value === "object" && value !== null) {
      accessibleVariants[key] = options.keepOpacity
        ? filterAccessibleAnimation(value)
        : undefined;
    } else {
      accessibleVariants[key] = value;
    }
  }
  
  return accessibleVariants as T;
}

/**
 * Props de animação seguras que respeitam reduced motion.
 * Use como base para componentes animados.
 * 
 * Exemplo:
 * ```tsx
 * <motion.div {...getAccessibleAnimationProps({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 },
 * })}>
 * ```
 */
export function getAccessibleAnimationProps(props: {
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition?: Transition;
}) {
  if (typeof window === "undefined") return props;
  
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  
  if (!prefersReduced) return props;
  
  return {
    initial: filterAccessibleAnimation(props.initial),
    animate: filterAccessibleAnimation(props.animate),
    exit: filterAccessibleAnimation(props.exit),
    transition: createA11yTransition(props.transition || {}),
  };
}
