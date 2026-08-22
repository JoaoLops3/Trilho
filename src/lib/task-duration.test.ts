import { describe, expect, it } from "vitest";
import {
  DURATION_STEP_SECONDS,
  formatDuration,
  formatTimerDisplay,
  parseDurationField,
  partsToSeconds,
  secondsToParts,
  snapDurationSeconds,
  stepDurationSeconds,
  validateDurationParts,
  validateDurationSeconds,
} from "./task-duration";

describe("secondsToParts / partsToSeconds", () => {
  it("converte ida e volta", () => {
    expect(secondsToParts(3661)).toEqual({ hours: 1, minutes: 1 });
    expect(partsToSeconds(1, 1)).toBe(3660);
  });
});

describe("formatDuration", () => {
  it("formata minutos ou horas", () => {
    expect(formatDuration(1800)).toBe("30 min");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(5400)).toBe("1h 30 min");
  });
});

describe("formatTimerDisplay", () => {
  it("usa MM:SS abaixo de 1h e H:MM:SS acima", () => {
    expect(formatTimerDisplay(125)).toBe("02:05");
    expect(formatTimerDisplay(3661)).toBe("1:01:01");
  });
});

describe("validateDurationSeconds", () => {
  it("rejeita fora dos limites", () => {
    expect(validateDurationSeconds(30)).toBe("Duração mínima é 1 minuto");
    expect(validateDurationSeconds(9 * 3600)).toBe("Duração máxima é 8 horas");
    expect(validateDurationSeconds(1800)).toBeNull();
  });
});

describe("snapDurationSeconds", () => {
  it("arredonda pro step de 15 min dentro dos limites", () => {
    expect(snapDurationSeconds(1000)).toBe(DURATION_STEP_SECONDS);
    expect(snapDurationSeconds(2000)).toBe(1800);
  });
});

describe("stepDurationSeconds", () => {
  it("incrementa/decrementa respeitando piso e teto", () => {
    expect(
      stepDurationSeconds(DURATION_STEP_SECONDS, -DURATION_STEP_SECONDS),
    ).toBe(DURATION_STEP_SECONDS);
    expect(stepDurationSeconds(3600, DURATION_STEP_SECONDS)).toBe(
      3600 + DURATION_STEP_SECONDS,
    );
  });
});

describe("validateDurationParts", () => {
  it("rejeita partes inválidas", () => {
    expect(validateDurationParts(9, 0)).toMatch(/Horas/);
    expect(validateDurationParts(1, 60)).toMatch(/Minutos/);
  });
});

describe("parseDurationField", () => {
  it("parseia campos vazios como erro", () => {
    expect(parseDurationField("", "")).toEqual({
      ok: false,
      error: "Informe a duração",
    });
  });

  it("parseia horas e minutos válidos", () => {
    expect(parseDurationField("1", "30")).toEqual({
      ok: true,
      seconds: 5400,
    });
  });
});
