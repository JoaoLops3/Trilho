import { describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import type { RoutineTemplate } from "../types/routine";
import {
  generateRoutineInstances,
  routineInstanceId,
} from "./routine-generator";

function task(partial: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: "Tarefa",
    category: "work",
    duration: 25,
    elapsed: 0,
    status: "pending",
    priority: "medium",
    ...partial,
  };
}

function routine(
  partial: Partial<RoutineTemplate> & Pick<RoutineTemplate, "id">,
): RoutineTemplate {
  return {
    title: "Rotina",
    category: "health",
    duration: 30,
    priority: "medium",
    weekdays: [5],
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("routineInstanceId", () => {
  it("combina template e data", () => {
    expect(routineInstanceId("tpl-1", "2026-08-22")).toBe("tpl-1:2026-08-22");
  });
});

describe("generateRoutineInstances", () => {
  const today = "2026-08-21"; // sexta-feira (weekday 5)

  it("gera instância quando rotina ativa cai no weekday", () => {
    const routines = [routine({ id: "r1", weekdays: [5] })];
    const result = generateRoutineInstances([], routines, today);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(routineInstanceId("r1", today));
    expect(result[0].routineTemplateId).toBe("r1");
  });

  it("não duplica instância já existente no dia", () => {
    const routines = [routine({ id: "r1", weekdays: [5] })];
    const existing = [
      task({
        id: routineInstanceId("r1", today),
        routineTemplateId: "r1",
        routineDate: today,
      }),
    ];
    expect(generateRoutineInstances(existing, routines, today)).toBe(existing);
  });

  it("remove pendente de dia passado não concluído", () => {
    const routines = [routine({ id: "r1", weekdays: [5] })];
    const stale = task({
      id: "old",
      routineTemplateId: "r1",
      routineDate: "2026-08-20",
    });
    const result = generateRoutineInstances([stale], routines, today);
    expect(result.some((t) => t.id === "old")).toBe(false);
    expect(result.some((t) => t.routineTemplateId === "r1")).toBe(true);
  });

  it("preserva concluídas de dias passados", () => {
    const routines = [routine({ id: "r1", weekdays: [5] })];
    const done = task({
      id: "done",
      status: "completed",
      routineTemplateId: "r1",
      routineDate: "2026-08-20",
      completedAt: "2026-08-20T10:00:00.000Z",
    });
    const result = generateRoutineInstances([done], routines, today);
    expect(result.some((t) => t.id === "done")).toBe(true);
  });

  it("ignora rotina inativa", () => {
    const routines = [routine({ id: "r1", weekdays: [5], active: false })];
    expect(generateRoutineInstances([], routines, today)).toEqual([]);
  });
});
