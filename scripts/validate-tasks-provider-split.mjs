/**
 * Guardrail: TasksProvider fatiado em domínio / sheet / lifecycle.
 * Roda: node --test scripts/validate-tasks-provider-split.mjs
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

describe("tasks-provider-split", () => {
  it("módulos de domínio, sheet e lifecycle existem", () => {
    assert.match(
      read("src/lib/tasks-domain-helpers.ts"),
      /getWallClockElapsed/,
    );
    assert.match(
      read("src/lib/tasks-domain-context.tsx"),
      /TasksDomainProvider/,
    );
    assert.match(read("src/lib/task-sheet-context.tsx"), /TaskSheetProvider/);
    assert.match(
      read("src/lib/use-task-app-lifecycle.ts"),
      /useTaskAppLifecycle/,
    );
  });

  it("tasks-context.tsx é compositor fino (sem CapApp)", () => {
    const facade = read("src/lib/tasks-context.tsx");
    assert.match(facade, /TasksDomainProvider/);
    assert.match(facade, /TaskSheetProvider/);
    assert.doesNotMatch(facade, /@capacitor\/app/);
    assert.doesNotMatch(facade, /CapApp/);
  });

  it("domínio usa lifecycle; sheet não importa CapApp", () => {
    assert.match(
      read("src/lib/tasks-domain-context.tsx"),
      /useTaskAppLifecycle/,
    );
    assert.doesNotMatch(
      read("src/lib/task-sheet-context.tsx"),
      /@capacitor\/app/,
    );
  });

  it("App.tsx ainda importa TasksProvider da fachada", () => {
    assert.match(read("src/App.tsx"), /from "\.\/lib\/tasks-context"/);
  });

  it("script test:tasks-split no package.json", () => {
    assert.match(
      read("package.json"),
      /"test:tasks-split": "node --test scripts\/validate-tasks-provider-split.mjs"/,
    );
  });
});
