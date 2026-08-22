import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Efeitos de ciclo de vida do app (nativo + web) ligados ao timer diário.
 * Separado do domínio para o TasksProvider não misturar CapApp/DOM aqui.
 */
export function useTaskAppLifecycle(options: {
  flushActiveElapsed: () => void;
  runDayRollover: () => void;
}): void {
  const { flushActiveElapsed, runDayRollover } = options;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener("appStateChange", ({ isActive }) => {
      flushActiveElapsed();
      if (isActive) runDayRollover();
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [flushActiveElapsed, runDayRollover]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushActiveElapsed();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flushActiveElapsed);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flushActiveElapsed);
    };
  }, [flushActiveElapsed]);

  useEffect(() => {
    runDayRollover();

    const interval = setInterval(runDayRollover, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") runDayRollover();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runDayRollover]);
}
