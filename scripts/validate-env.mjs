/**
 * Validação estática: env do client validada com Zod no boot.
 * Roda: node --test scripts/validate-env.mjs
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

describe("env — bootstrap", () => {
  const envTs = read("src/lib/env.ts");
  const main = read("src/main.tsx");
  const supabase = read("src/lib/supabase.ts");
  const posthog = read("src/lib/posthog.ts");
  const pkg = read("package.json");

  it("exporta parseRawClientEnv e clientEnv com Zod", () => {
    assert.match(envTs, /from "zod"/);
    assert.match(envTs, /export function parseRawClientEnv/);
    assert.match(envTs, /export const clientEnv/);
  });

  it("main.tsx valida env no boot", () => {
    assert.match(main, /validateClientEnvAtBoot/);
    assert.match(main, /warnPrivilegedViteEnv/);
  });

  it("supabase.ts lê clientEnv (não import.meta.env direto)", () => {
    assert.match(supabase, /from "\.\/env"/);
    assert.doesNotMatch(supabase, /import\.meta\.env\.VITE_SUPABASE/);
  });

  it("posthog.ts lê clientEnv", () => {
    assert.match(posthog, /clientEnv\.posthogKey/);
    assert.doesNotMatch(posthog, /import\.meta\.env\.VITE_POSTHOG/);
  });

  it("script test:env existe", () => {
    assert.match(pkg, /"test:env": "node --test scripts\/validate-env.mjs"/);
  });

  it("env.test.ts cobre parseRawClientEnv", () => {
    const testFile = read("src/lib/env.test.ts");
    assert.match(testFile, /parseRawClientEnv/);
    assert.match(testFile, /offline-only|omitir Supabase/);
  });
});
