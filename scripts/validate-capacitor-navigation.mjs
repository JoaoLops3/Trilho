/**
 * Guardrail: allowlist de navegação no Capacitor WebView.
 * Roda: node --test scripts/validate-capacitor-navigation.mjs
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

describe("capacitor — allowNavigation", () => {
  const config = read("capacitor.config.ts");

  it("define allowNavigation com domínios críticos", () => {
    assert.match(config, /allowNavigation:/);
    assert.match(config, /\*\.supabase\.co/);
    assert.match(config, /posthog\.com/);
    assert.match(config, /api\.dicebear\.com/);
  });

  it("android allowMixedContent permanece false", () => {
    assert.match(config, /allowMixedContent: false/);
  });
});
