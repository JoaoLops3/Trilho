import { type ReactNode, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { Redirect, useLocation } from "react-router-dom";
import { useAuth, isAuthRoute, NEW_PASSWORD_PATH } from "../lib/auth-context";
import { useShouldOfferRoutineOnboarding } from "../lib/use-routine-onboarding-gate";
import { AppLogo } from "./AppLogo";

const ONBOARDING_PATH = "/rotina/montar";

function AuthLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-0 flex items-center justify-center bg-surface-primary"
      aria-busy="true"
      aria-label="Carregando"
    >
      <AppLogo size={48} className="animate-pulse" />
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    authConfigured,
    passwordRecoveryPending,
  } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const splashHiddenRef = useRef(false);
  const { ready: onboardingReady, shouldOffer } =
    useShouldOfferRoutineOnboarding();

  useEffect(() => {
    if (isLoading || splashHiddenRef.current || !Capacitor.isNativePlatform()) {
      return;
    }
    splashHiddenRef.current = true;
    void SplashScreen.hide();
  }, [isLoading]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!authConfigured) {
    if (pathname === "/" && !onboardingReady) {
      return <AuthLoadingScreen />;
    }
    if (pathname === "/" && shouldOffer) {
      return <Redirect to={ONBOARDING_PATH} />;
    }
    return <>{children}</>;
  }

  // Recovery (iOS deep link / web): força a tela de nova senha antes do app.
  if (
    isAuthenticated &&
    passwordRecoveryPending &&
    pathname !== NEW_PASSWORD_PATH
  ) {
    return <Redirect to={NEW_PASSWORD_PATH} />;
  }

  if (!isAuthenticated && !isAuthRoute(pathname)) {
    return <Redirect to="/login" />;
  }

  if (
    isAuthenticated &&
    !passwordRecoveryPending &&
    (pathname === "/login" ||
      pathname === "/cadastro" ||
      pathname === NEW_PASSWORD_PATH)
  ) {
    // Evita piscar o Dashboard: só redireciona quando a decisão estiver pronta.
    if (!onboardingReady) {
      return <AuthLoadingScreen />;
    }
    return <Redirect to={shouldOffer ? ONBOARDING_PATH : "/"} />;
  }

  // Sessão restaurada no Dashboard: segura loading até o sync decidir se
  // o onboarding deve aparecer (evita flash de lista vazia → dados remotos).
  if (isAuthenticated && pathname === "/" && !onboardingReady) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && pathname === "/" && shouldOffer) {
    return <Redirect to={ONBOARDING_PATH} />;
  }

  return <>{children}</>;
}
