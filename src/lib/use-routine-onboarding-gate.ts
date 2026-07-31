import { useAuth } from "./auth-context";
import { useSync } from "./sync-context";
import { useTasks } from "./tasks-context";
import { useRoutines } from "./routines-context";
import { hasSeenRoutineOnboarding } from "./routine-onboarding";

/**
 * Decide se o onboarding de rotinas prontas deve aparecer.
 * Espera o initial sync terminar — evita oferecer onboarding a quem já tem
 * dados na nuvem (corrida do primeiro render pós-login).
 */
export function useShouldOfferRoutineOnboarding(): {
  ready: boolean;
  shouldOffer: boolean;
} {
  const { isAuthenticated, authConfigured, isLoading } = useAuth();
  const { initialSyncComplete, importPromptOpen } = useSync();
  const { tasks } = useTasks();
  const { routines } = useRoutines();

  if (isLoading) {
    return { ready: false, shouldOffer: false };
  }

  // Modo com auth: só para usuário autenticado, e só depois do first sync.
  if (authConfigured) {
    if (!isAuthenticated) {
      return { ready: true, shouldOffer: false };
    }
    if (!initialSyncComplete) {
      return { ready: false, shouldOffer: false };
    }
  }

  // Import sheet aberto: libera a UI, mas não oferece onboarding ainda.
  if (importPromptOpen) {
    return { ready: true, shouldOffer: false };
  }

  if (hasSeenRoutineOnboarding()) {
    return { ready: true, shouldOffer: false };
  }

  if (tasks.length > 0 || routines.length > 0) {
    return { ready: true, shouldOffer: false };
  }

  return { ready: true, shouldOffer: true };
}
