/**
 * Valores canônicos da paleta — espelham `tailwind.config.js`.
 * Usar em SVG/canvas onde classes Tailwind não aplicam (fill/stroke).
 * Se mudar a paleta no Tailwind, atualizar aqui.
 */
export const themeColors = {
  mint: {
    300: "#86efac",
    400: "#6ee7b7",
    500: "#34d399",
    600: "#10b981",
  },
  coral: {
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
  },
  obsidian: {
    50: "#f7f7f8",
    300: "#babac5",
    400: "#a0a1ac",
    500: "#8a8b96",
    600: "#6d6e79",
    700: "#505059",
    800: "#42424a",
    950: "#0d0d12",
  },
  surface: {
    primary: "#0d0d12",
    secondary: "#1a1a22",
    tertiary: "#252530",
    elevated: "#2d2d3a",
  },
} as const;
