/**
 * Guardrail: identidade visual trem/trilho além do TrainStreakCard.
 * Roda: node --test scripts/validate-trilho-identity.mjs
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

describe("trilho-identity", () => {
  it("RailMark e TrilhoEmptyState existem", () => {
    assert.match(
      read("src/components/RailMark.tsx"),
      /export function RailMark/,
    );
    assert.match(
      read("src/components/RailMark.tsx"),
      /export function SectionRailHeading/,
    );
    assert.match(
      read("src/components/TrilhoEmptyState.tsx"),
      /export function TrilhoEmptyState/,
    );
  });

  it("Dashboard usa SectionRailHeading + empty do trilho", () => {
    const dash = read("src/screens/DashboardScreen.tsx");
    assert.match(dash, /SectionRailHeading/);
    assert.match(dash, /TrilhoEmptyState/);
    assert.match(dash, /No trilho/);
  });

  it("Login exibe RailMark; HeaderBar usa tagline do trilho", () => {
    assert.match(read("src/screens/LoginScreen.tsx"), /RailMark/);
    assert.match(read("src/components/HeaderBar.tsx"), /APP_TAGLINE/);
    assert.doesNotMatch(read("src/components/HeaderBar.tsx"), /RailMark/);
  });

  it("FocusWeekChart ancora o gráfico no trilho", () => {
    assert.match(read("src/components/FocusWeekChart.tsx"), /RailMark/);
  });

  it("TabBar ativa usa indicador em trilho (duas linhas)", () => {
    const tab = read("src/components/CustomTabBar.tsx");
    assert.match(tab, /h-\[1\.5px\] w-3/);
  });

  it("script test:trilho-identity no package.json", () => {
    assert.match(
      read("package.json"),
      /"test:trilho-identity": "node --test scripts\/validate-trilho-identity.mjs"/,
    );
  });
});
