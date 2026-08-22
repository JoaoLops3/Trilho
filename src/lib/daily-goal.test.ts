import { describe, expect, it } from "vitest";
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  LEGACY_DAILY_GOAL_MINUTES,
  formatDailyGoalLabel,
  isDailyGoalPreset,
  mergeDailyGoalMinutes,
} from "./daily-goal";

describe("formatDailyGoalLabel", () => {
  it("formata horas", () => {
    expect(formatDailyGoalLabel(60)).toBe("1h");
    expect(formatDailyGoalLabel(180)).toBe("3h");
  });
});

describe("isDailyGoalPreset", () => {
  it("reconhece presets válidos", () => {
    expect(isDailyGoalPreset(120)).toBe(true);
    expect(isDailyGoalPreset(999)).toBe(false);
  });
});

describe("mergeDailyGoalMinutes", () => {
  it("retorna remoto quando iguais", () => {
    expect(mergeDailyGoalMinutes(180, 180)).toBe(180);
  });

  it("prioriza local quando remoto é default e local não", () => {
    expect(mergeDailyGoalMinutes(240, DEFAULT_DAILY_GOAL_MINUTES)).toBe(240);
  });

  it("prioriza remoto quando local é default e remoto não", () => {
    expect(mergeDailyGoalMinutes(DEFAULT_DAILY_GOAL_MINUTES, 240)).toBe(240);
  });

  it("trata meta legada como default", () => {
    expect(mergeDailyGoalMinutes(LEGACY_DAILY_GOAL_MINUTES, 120)).toBe(120);
  });

  it("em conflito entre preset remoto legado e escolha local, local vence", () => {
    // 300 é LEGACY_DAILY_GOAL_MINUTES — tratado como default remoto.
    expect(mergeDailyGoalMinutes(240, LEGACY_DAILY_GOAL_MINUTES)).toBe(240);
  });

  it("quando ambos são presets não-default, remoto vence", () => {
    expect(mergeDailyGoalMinutes(120, 240)).toBe(240);
  });
});
