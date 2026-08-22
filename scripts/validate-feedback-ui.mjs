/**
 * Guardrail: feedback UI montado nos fluxos reais (não só componentes mortos).
 * Roda: node --test scripts/validate-feedback-ui.mjs
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

describe("feedback-ui-wiring", () => {
  it("OfflineNetworkBanner monta NetworkErrorState no App", () => {
    const banner = read("src/components/OfflineNetworkBanner.tsx");
    const app = read("src/App.tsx");
    assert.match(banner, /NetworkErrorState/);
    assert.match(banner, /refreshFromCloud/);
    assert.match(app, /OfflineNetworkBanner/);
    assert.match(app, /<OfflineNetworkBanner\s*\/>/);
  });

  it("LoginScreen usa useAsyncAction + GenericErrorState", () => {
    const login = read("src/screens/LoginScreen.tsx");
    assert.match(login, /useAsyncAction/);
    assert.match(login, /GenericErrorState/);
    assert.match(login, /ButtonWithLoading/);
  });

  it("task sheet dá toast de sucesso ao salvar", () => {
    const sheet = read("src/lib/task-sheet-context.tsx");
    assert.match(sheet, /useToast/);
    assert.match(sheet, /Tarefa criada/);
    assert.match(sheet, /Tarefa atualizada/);
  });

  it("sheets principais usam useFocusTrap", () => {
    assert.match(read("src/components/NewTaskSheet.tsx"), /useFocusTrap/);
    assert.match(
      read("src/components/EditDisplayNameSheet.tsx"),
      /useFocusTrap/,
    );
    assert.match(
      read("src/components/ConfirmDeleteAccountSheet.tsx"),
      /useFocusTrap/,
    );
  });

  it("script test:feedback-ui no package.json", () => {
    assert.match(
      read("package.json"),
      /"test:feedback-ui": "node --test scripts\/validate-feedback-ui.mjs"/,
    );
  });
});
