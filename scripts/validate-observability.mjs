/**
 * Validação estática: pipeline de observabilidade (reportError, sync tagging, globals).
 * Roda: node --test scripts/validate-observability.mjs
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

describe("observability — módulo central", () => {
  const observability = read("src/lib/observability.ts");
  const runtime = read("src/lib/runtime-context.ts");

  it("exporta reportError e installGlobalErrorHandlers", () => {
    assert.match(observability, /export function reportError/);
    assert.match(observability, /export function installGlobalErrorHandlers/);
  });

  it("runtime-context expõe app_version e platform", () => {
    assert.match(runtime, /export function getRuntimeContext/);
    assert.match(runtime, /app_version/);
    assert.match(runtime, /platform/);
  });

  it("reportError usa captureException com error_surface", () => {
    assert.match(observability, /error_surface: context\.surface/);
  });
});

describe("posthog — super-propriedades no init", () => {
  it("registra getRuntimeContext após init", () => {
    const posthog = read("src/lib/posthog.ts");
    assert.match(posthog, /posthog\.register\(getRuntimeContext\(\)\)/);
  });
});

describe("ErrorBoundary — reportError padronizado", () => {
  it("não chama captureException diretamente", () => {
    const boundary = read("src/components/ErrorBoundary.tsx");
    assert.doesNotMatch(boundary, /captureException/);
    assert.match(boundary, /reportError\(error,/);
    assert.match(boundary, /surface: "error_boundary"/);
  });
});

describe("sync-context — erros com operação", () => {
  const sync = read("src/lib/sync-context.tsx");

  it("notifySyncError recebe operation", () => {
    assert.match(sync, /meta: \{ operation: string; pushKey\?: string \}/);
    assert.match(sync, /surface: "sync"/);
  });

  it("push debounced taggeia pushKey", () => {
    assert.match(sync, /operation: "push", pushKey: key/);
  });

  it("initial sync e refresh taggeados", () => {
    assert.match(sync, /operation: "initial_sync"/);
    assert.match(sync, /operation: "refresh"/);
  });
});

describe("App — handlers globais", () => {
  it("instala installGlobalErrorHandlers no mount", () => {
    const app = read("src/App.tsx");
    assert.match(app, /installGlobalErrorHandlers\(\)/);
    assert.match(app, /surface: "native", operation: "status_bar_init"/);
  });
});

describe("auth — erros desconhecidos reportados", () => {
  it("mapAuthErrorWithTelemetry reporta só generic", () => {
    const authErrors = read("src/lib/auth-errors.ts");
    assert.match(authErrors, /export function mapAuthErrorWithTelemetry/);
    assert.match(authErrors, /mapped === GENERIC_AUTH_ERROR/);
  });

  it("auth-context usa mapAuthErrorWithTelemetry", () => {
    const auth = read("src/lib/auth-context.tsx");
    assert.match(auth, /mapAuthErrorWithTelemetry/);
    assert.doesNotMatch(auth, /mapAuthError\(/);
  });
});
