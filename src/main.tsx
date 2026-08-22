import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import App from "./App";
import { validateClientEnvAtBoot, warnPrivilegedViteEnv } from "./lib/env";
import { posthog, captureEvent } from "./lib/posthog";
import { migrateLegacyStorageKeys } from "./lib/storage-keys";

// Custom styles (includes Tailwind + custom design system)
import "./index.css";

// Ionic theme overrides
import "./theme/variables.css";

validateClientEnvAtBoot();
warnPrivilegedViteEnv();
migrateLegacyStorageKeys();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
);

// Disparado após o render para não bloquear o boot; o init do PostHog é
// agendado de forma diferida e o evento fica na fila até estar pronto.
captureEvent("app opened");
