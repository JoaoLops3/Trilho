/**
 * Validação estática da migration RLS initplan.
 * Roda: node --test scripts/validate-rls-initplan.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = "supabase/migrations/20260822142153_rls_initplan.sql";

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("rls initplan migration", () => {
  const sql = read(migrationPath);

  it("existe migration 20260822142153_rls_initplan.sql", () => {
    assert.ok(sql.length > 0);
  });

  it("recria 24 policies (6 tabelas x 4 operacoes)", () => {
    const creates = sql.match(/^create policy /gm) ?? [];
    assert.equal(creates.length, 24);
  });

  it("usa (select auth.uid()) em todas as policies", () => {
    const initplanCount = sql.match(/\(select auth\.uid\(\)\)/g) ?? [];
    // 24 policies: 6 select + 6 insert + 6 delete + 12 update (using+with check) = 30
    assert.ok(
      initplanCount.length >= 30,
      `esperado >= 30 ocorrencias de (select auth.uid()), got ${initplanCount.length}`,
    );
  });

  it("nao deixa auth.uid() nu fora de subselect", () => {
    const lines = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .filter(
        (line) => /using\s*\(/i.test(line) || /with check\s*\(/i.test(line),
      );
    for (const line of lines) {
      assert.doesNotMatch(
        line,
        /(?<!\(select )auth\.uid\(\)/,
        `linha com auth.uid() sem initplan: ${line.trim()}`,
      );
    }
  });

  it("cobre as 6 tabelas com RLS", () => {
    for (const table of [
      "profiles",
      "tasks",
      "day_history",
      "notification_preferences",
      "notifications",
      "routine_templates",
    ]) {
      assert.match(sql, new RegExp(`on public\\.${table}`));
    }
  });
});
