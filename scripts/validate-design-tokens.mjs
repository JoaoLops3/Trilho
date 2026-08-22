/**
 * Validação estática: componentes sem hex/rgba hardcoded em style inline.
 * Roda: node --test scripts/validate-design-tokens.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const COMPONENT_PATHS = [
  "src/components/AuthGate.tsx",
  "src/components/AppLogo.tsx",
  "src/components/CustomTabBar.tsx",
  "src/components/HeaderBar.tsx",
  "src/components/TaskCard.tsx",
  "src/screens/ProfileScreen.tsx",
];

const INLINE_COLOR = /style=\{\{[^}]*(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/;

describe("theme-colors — sombras canônicas", () => {
  const theme = read("src/lib/theme-colors.ts");
  const tailwind = read("tailwind.config.js");

  it("exporta themeShadows espelhando tailwind", () => {
    assert.match(theme, /export const themeShadows/);
    assert.match(tailwind, /glow-mint-fab/);
    assert.match(tailwind, /glow-mint-active/);
  });
});

describe("componentes — sem cor hardcoded em style inline", () => {
  for (const path of COMPONENT_PATHS) {
    it(path, () => {
      const src = read(path);
      assert.doesNotMatch(
        src,
        INLINE_COLOR,
        `${path} ainda tem cor/sombra hardcoded em style={{}}`,
      );
    });
  }
});

describe("AuthGate — bg via token Tailwind", () => {
  it("usa bg-surface-primary", () => {
    assert.match(read("src/components/AuthGate.tsx"), /bg-surface-primary/);
  });
});

describe("CustomTabBar — glow via token Tailwind", () => {
  const src = read("src/components/CustomTabBar.tsx");

  it("FAB usa shadow-glow-mint-fab", () => {
    assert.match(src, /shadow-glow-mint-fab/);
  });

  it("tab ativa usa bg-white/5", () => {
    assert.match(src, /bg-white\/5/);
  });
});
