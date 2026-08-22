/**
 * Validação estática: pipeline CI roda testes automatizados no GitHub.
 * Roda: node --test scripts/validate-ci.mjs
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

describe("CI — GitHub Actions", () => {
  const workflow = read(".github/workflows/ci.yml");

  it("existe workflow ci.yml", () => {
    assert.match(workflow, /name: CI/);
  });

  it("roda em push/PR para main", () => {
    assert.match(workflow, /branches: \[main\]/);
    assert.match(workflow, /pull_request/);
  });

  it("executa typecheck, lint, test e build", () => {
    assert.match(workflow, /npm run typecheck/);
    assert.match(workflow, /npm run lint/);
    assert.match(workflow, /npm run test/);
    assert.match(workflow, /npm run build/);
  });

  it("usa Node 24 alinhado ao engines", () => {
    assert.match(workflow, /node-version: "24"/);
    assert.match(read("package.json"), /"node": "24.x"/);
  });
});
