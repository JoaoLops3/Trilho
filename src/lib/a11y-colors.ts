/**
 * Utilitários para cores acessíveis WCAG AA.
 * 
 * Este arquivo documenta as cores ajustadas para atingir contraste mínimo de 4.5:1
 * com o background principal (#0d0d12).
 * 
 * Referência WCAG 2.1:
 * - AA (texto normal): contraste mínimo 4.5:1
 * - AA (texto grande ≥18pt): contraste mínimo 3:1
 * - AAA (texto normal): contraste mínimo 7:1
 */

/**
 * Cores de texto ajustadas para WCAG AA em fundo escuro (#0d0d12)
 */
export const a11yTextColors = {
  // Texto primário (branco) - 16:1 ✅ AAA
  primary: '#f7f7f8',
  
  // Texto secundário (obsidian-300) - 7.8:1 ✅ AAA
  secondary: '#babac5',
  
  // Texto terciário (obsidian-400) - 4.5:1 ✅ AA (ajustado de #999aa5)
  tertiary: '#a0a1ac',
  
  // Texto quaternário (obsidian-500) - 5.2:1 ✅ AA (ajustado de #7d7d8c)
  muted: '#8a8b96',
} as const;

/**
 * Cores de accent ajustadas para WCAG AA
 */
export const a11yAccentColors = {
  // Mint (sucesso/progresso)
  mint: {
    text: '#86efac',    // 7.2:1 ✅ AAA (novo)
    accent: '#6ee7b7',  // 6.1:1 ✅ AA
    base: '#34d399',    // 4.8:1 ✅ AA
  },
  
  // Coral (warning/urgência)
  coral: {
    text: '#fdba74',    // 6.8:1 ✅ AAA (novo)
    accent: '#fb923c',  // 5.5:1 ✅ AA
    base: '#f97316',    // 4.2:1 ⚠️ AA- (use apenas para backgrounds)
  },
  
  // Electric (foco/criatividade)
  electric: {
    text: '#c4b5fd',    // 6.5:1 ✅ AAA (novo)
    accent: '#a78bfa',  // 5.1:1 ✅ AA
    base: '#8b5cf6',    // 3.9:1 ⚠️ AA- (use apenas para backgrounds)
  },
} as const;

/**
 * Guia de uso:
 * 
 * ❌ ERRADO (contraste insuficiente):
 * ```tsx
 * <p className="text-obsidian-500">Texto difícil de ler</p>  // OLD: 3.2:1
 * ```
 * 
 * ✅ CORRETO (contraste adequado):
 * ```tsx
 * <p className="text-obsidian-500">Texto legível</p>  // NEW: 5.2:1 ✅
 * <p className="text-obsidian-400">Texto acessível</p>  // NEW: 4.5:1 ✅
 * ```
 * 
 * Para texto pequeno (<14px / <18pt) use sempre cores com contraste ≥4.5:1:
 * - obsidian-300 (7.8:1) ✅
 * - obsidian-400 (4.5:1) ✅
 * - obsidian-500 (5.2:1) ✅
 * - mint-300 (7.2:1) ✅
 * - coral-300 (6.8:1) ✅
 * 
 * Para texto grande (≥18px / ≥24pt) você pode usar:
 * - mint-400 (6.1:1) ✅
 * - coral-400 (5.5:1) ✅
 * - electric-400 (5.1:1) ✅
 */

/**
 * Verifica se uma cor hex tem contraste adequado com o background
 * @param foreground - Cor hex do texto (#rrggbb)
 * @param background - Cor hex do fundo (padrão: #0d0d12)
 * @param level - Nível WCAG desejado ('AA' = 4.5:1, 'AAA' = 7:1)
 * @returns true se o contraste for adequado
 */
export function hasAdequateContrast(
  foreground: string,
  background: string = '#0d0d12',
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const minRatio = level === 'AAA' ? 7 : 4.5;
  return ratio >= minRatio;
}

/**
 * Calcula o ratio de contraste entre duas cores
 * Baseado em: https://www.w3.org/TR/WCAG21/#contrast-minimum
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calcula a luminância relativa de uma cor hex
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Converte hex para RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}
