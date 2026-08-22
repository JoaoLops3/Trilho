/**
 * Validação estática: Vitest configurado e testes de domínio presentes.
 * Roda: node --test scripts/validate-vitest.mjs
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

const DOMAIN_TEST_FILES = [
  "src/lib/day-stats.test.ts",
  "src/lib/day-rollover.test.ts",
  "src/lib/routine-generator.test.ts",
  "src/lib/daily-goal.test.ts",
  "src/lib/auth-errors.test.ts",
  "src/lib/week-utils.test.ts",
  "src/lib/task-duration.test.ts",
  "src/lib/routine-dedupe.test.ts",
  "src/lib/notification-scheduler.test.ts",
  "src/lib/sync/mappers.test.ts",
  "src/lib/sync/mappers-local-data.test.ts",
  "src/lib/sync/assert-no-sync-error.test.ts",
  "src/lib/sync/cloud-sync.test.ts",
  "src/lib/storage-runtime.test.ts",
  "src/lib/env.test.ts",
];

describe("vitest — bootstrap", () => {
  const pkg = read("package.json");
  const config = read("vitest.config.ts");

  it("script test:unit usa vitest run", () => {
    assert.match(pkg, /"test:unit": "vitest run"/);
  });

  it("vitest.config inclui src/**/*.test.ts", () => {
    assert.match(config, /src\/\*\*\/\*\.test\.ts/);
  });

  it("vitest está em devDependencies", () => {
    assert.match(pkg, /"vitest"/);
  });
});

describe("domínio — arquivos de teste", () => {
  for (const path of DOMAIN_TEST_FILES) {
    it(path, () => {
      const src = read(path);
      assert.match(src, /describe\(/);
      assert.match(src, /expect\(/);
    });
  }
});

describe("day-stats — cobre lógica crítica de streak", () => {
  const src = read("src/lib/day-stats.test.ts");

  it("testa computeStreak e computeRecordStreak", () => {
    assert.match(src, /computeStreak/);
    assert.match(src, /computeRecordStreak/);
  });
});

describe("routine-generator — cobre dedup e limpeza", () => {
  const src = read("src/lib/routine-generator.test.ts");

  it("testa generateRoutineInstances", () => {
    assert.match(src, /generateRoutineInstances/);
    assert.match(src, /preserva concluídas/);
  });
});

describe("cloud-sync — mock Supabase", () => {
  const src = read("src/lib/sync/cloud-sync.test.ts");

  it("testa sync, pull, push e hasCloudData", () => {
    assert.match(src, /syncTasksToCloud/);
    assert.match(src, /pullUserSnapshot/);
    assert.match(src, /pushUserSnapshot/);
    assert.match(src, /hasCloudData/);
    assert.match(src, /getSupabase/);
  });
});
