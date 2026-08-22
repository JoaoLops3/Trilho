/**
 * Validação estática: localStorage com schema runtime (Zod), sem cast cego.
 * Roda: node --test scripts/validate-storage-runtime.mjs
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

const STORAGE_LOADERS = [
  "src/lib/storage.ts",
  "src/lib/routine-storage.ts",
  "src/lib/notification-storage.ts",
  "src/lib/day-stats.ts",
  "src/lib/profile-storage.ts",
  "src/lib/notification-preferences.ts",
];

describe("storage runtime — bootstrap", () => {
  const pkg = read("package.json");

  it("zod está em dependencies", () => {
    assert.match(pkg, /"zod":/);
  });

  it("exporta schemas e runtime parse", () => {
    assert.match(read("src/lib/storage-schemas.ts"), /export const taskSchema/);
    assert.match(
      read("src/lib/storage-runtime.ts"),
      /export function parseStorageArray/,
    );
  });

  it("observability inclui surface storage", () => {
    assert.match(read("src/lib/observability.ts"), /"storage"/);
  });
});

describe("storage loaders — sem cast cego", () => {
  for (const file of STORAGE_LOADERS) {
    it(file, () => {
      const source = read(file);
      assert.doesNotMatch(source, /as Task\[\]/);
      assert.doesNotMatch(source, /as RoutineTemplate\[\]/);
      assert.doesNotMatch(source, /as AppNotification\[\]/);
      assert.doesNotMatch(source, /as DayStat\[\]/);
      assert.match(source, /parseStorage(Array|Json|Object)|storage-schemas/);
    });
  }
});

describe("storage — testes vitest", () => {
  it("existe storage-runtime.test.ts", () => {
    const testFile = read("src/lib/storage-runtime.test.ts");
    assert.match(testFile, /parseStorageArray/);
    assert.match(testFile, /loadTasks/);
  });
});
