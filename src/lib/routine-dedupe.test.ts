import { describe, expect, it } from "vitest";
import type { RoutineTemplate, RoutineTemplateInput } from "../types/routine";
import {
  findMatchingRoutine,
  formatRoutineDedupeMessage,
  isSameRoutine,
  partitionRoutineInputs,
  routineIdentityKey,
} from "./routine-dedupe";

const baseInput: RoutineTemplateInput = {
  title: "Academia",
  category: "health",
  duration: 1800,
  priority: "medium",
  weekdays: [1, 3, 5],
  scheduledTime: "07:00",
};

function existing(
  partial: Partial<RoutineTemplate> & Pick<RoutineTemplate, "id">,
): RoutineTemplate {
  return {
    title: "Academia",
    category: "health",
    duration: 1800,
    priority: "medium",
    weekdays: [1, 3, 5],
    scheduledTime: "07:00",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("routineIdentityKey", () => {
  it("normaliza título e ordena weekdays", () => {
    const key = routineIdentityKey({
      ...baseInput,
      title: "  Academia ",
      weekdays: [5, 1, 3],
    });
    expect(key).toBe("academia|1800|1,3,5|07:00");
  });
});

describe("isSameRoutine / findMatchingRoutine", () => {
  it("detecta rotina equivalente", () => {
    const saved = [existing({ id: "r1" })];
    expect(isSameRoutine(baseInput, saved[0])).toBe(true);
    expect(findMatchingRoutine(baseInput, saved)?.id).toBe("r1");
  });
});

describe("partitionRoutineInputs", () => {
  it("separa novos de duplicados 1:1", () => {
    const saved = [existing({ id: "r1" })];
    const items: RoutineTemplateInput[] = [
      baseInput,
      { ...baseInput, title: "Correr" },
      baseInput,
    ];
    const result = partitionRoutineInputs(items, saved);
    expect(result.duplicateCount).toBe(1);
    expect(result.freshCount).toBe(2);
    expect(result.duplicateIndexes).toEqual([0]);
  });

  it("marca allDuplicates quando preview inteiro já existe", () => {
    const result = partitionRoutineInputs(
      [baseInput],
      [existing({ id: "r1" })],
    );
    expect(result.allDuplicates).toBe(true);
    expect(result.freshCount).toBe(0);
  });
});

describe("formatRoutineDedupeMessage", () => {
  it("retorna copy amigável para todos duplicados", () => {
    expect(
      formatRoutineDedupeMessage({
        fresh: [],
        duplicateIndexes: [0],
        duplicateCount: 1,
        freshCount: 0,
        allDuplicates: true,
        noneDuplicates: false,
      }),
    ).toMatch(/já tem essa rotina/i);
  });
});
