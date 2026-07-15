import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],
  // PostCSS inline: evita postcss-load-config (travava o event loop no Node 23).
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    noDiscovery: true,
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      // react-router v5 (CJS) — sem isso prop-types quebra o named default import
      "react-router",
      "react-router-dom",
      "prop-types",
      "history",
      "tiny-warning",
      "tiny-invariant",
    ],
    exclude: [
      "lucide-react",
      "@ionic/react",
      "@ionic/react-router",
      "@aparajita/capacitor-secure-storage",
      "@capacitor/core",
      "@capacitor/app",
      "@capacitor/keyboard",
      "@capacitor/local-notifications",
      "@capacitor/splash-screen",
      "@capacitor/status-bar",
      "capacitor-native-settings",
      "posthog-js",
      "@posthog/react",
      "@supabase/supabase-js",
      "framer-motion",
    ],
  },
  server: {
    // 0.0.0.0: IPv4+IPv6 (localhost-only quebrava curl/Brave em 127.0.0.1)
    host: "0.0.0.0",
    port: 8100,
    strictPort: true,
    watch: {
      // Capacitor sync reescreve ios/ e reiniciava o Vite no meio do optimizeDeps.
      ignored: ["**/ios/**", "**/android/**", "**/dist/**", "**/.git/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-ionic": ["@ionic/react", "@ionic/react-router"],
          "vendor-motion": ["framer-motion"],
          "vendor-analytics": ["posthog-js", "@posthog/react"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
