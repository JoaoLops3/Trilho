/**
 * Validação sem Vitest (ainda não está no package.json).
 * Roda: node --test scripts/validate-sync-push-before-pull.mjs
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

/** Espelha src/lib/sync/assert-no-sync-error.ts — contrato do helper. */
function assertNoSyncError(error, context) {
  if (error) {
    throw new Error(`sync ${context}: ${error.message}`);
  }
}

describe("assertNoSyncError", () => {
  it("não lança quando error é null", () => {
    assert.doesNotThrow(() => assertNoSyncError(null, "upsert tasks"));
  });

  it("lança com contexto e message quando há erro", () => {
    assert.throws(
      () => assertNoSyncError({ message: "JWT expired" }, "pull tasks"),
      (err) => {
        assert.equal(err.message, "sync pull tasks: JWT expired");
        return true;
      },
    );
  });
});

describe("refreshFromCloud — push-before-pull (fonte)", () => {
  const src = read("src/lib/sync-context.tsx");
  const refreshStart = src.indexOf("const refreshFromCloud = useCallback");
  const refreshEnd = src.indexOf("}, [", refreshStart);
  const body = src.slice(refreshStart, refreshEnd);

  it("flushPendingPushes existe e é chamado no refresh", () => {
    assert.match(src, /const flushPendingPushes = useCallback/);
    assert.match(body, /flushPendingPushes\(\)/);
  });

  it("pushUserSnapshot vem antes de pullUserSnapshot no refresh", () => {
    const pushAt = body.indexOf("pushUserSnapshot");
    const pullAt = body.indexOf("pullUserSnapshot");
    assert.ok(pushAt >= 0, "pushUserSnapshot ausente no refresh");
    assert.ok(pullAt >= 0, "pullUserSnapshot ausente no refresh");
    assert.ok(
      pushAt < pullAt,
      "push deve ocorrer antes do pull (push-before-pull)",
    );
  });

  it("não faz refresh antes do initial sync completo", () => {
    assert.match(body, /initialSyncCompleteRef\.current/);
  });

  it("guarda contra refresh concorrente", () => {
    assert.match(body, /refreshInFlightRef\.current/);
  });

  it("notifica falha com toast / notifySyncError", () => {
    assert.match(body, /notifySyncError/);
    assert.match(src, /Tentar novamente/);
    assert.match(src, /Não foi possível sincronizar/);
  });
});

describe("cloud-sync — propagação de erro", () => {
  const src = read("src/lib/sync/cloud-sync.ts");

  it("importa assertNoSyncError", () => {
    assert.match(src, /from "\.\/assert-no-sync-error"/);
  });

  it("asserta erros no pull (não vira snapshot vazio silencioso)", () => {
    assert.match(src, /assertNoSyncError\(profileRes\.error/);
    assert.match(src, /assertNoSyncError\(tasksRes\.error/);
  });

  it("asserta erros em upsert/delete de tasks", () => {
    assert.match(src, /assertNoSyncError\(error, "upsert tasks"\)/);
    assert.match(src, /assertNoSyncError\(error, "delete tasks"\)/);
  });
});

describe("SyncStatusIndicator montado", () => {
  const app = read("src/App.tsx");

  it("App importa e renderiza SyncStatusIndicator", () => {
    assert.match(app, /import \{ SyncStatusIndicator \}/);
    assert.match(app, /<SyncStatusIndicator\s*\/>/);
  });
});

describe("docs sync-behavior", () => {
  const docs = read("docs/sync-behavior.md");

  it("documenta push-before-pull e toast de retry", () => {
    assert.match(docs, /push-before-pull/i);
    assert.match(docs, /Tentar novamente/);
    assert.match(docs, /SyncStatusIndicator/);
  });
});
