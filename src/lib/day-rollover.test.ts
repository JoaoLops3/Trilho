import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import { installLocalStorageMock } from "../test/local-storage-mock";
import { STORAGE_KEYS } from "./storage-keys";
import { loadLastFocusDay, rolloverTasksIfNewDay } from "./day-rollover";

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

describe("rolloverTasksIfNewDay", () => {
  let restoreStorage: () => void;

  beforeEach(() => {
    ({ restore: restoreStorage } = installLocalStorageMock());
  });

  afterEach(() => {
    restoreStorage();
  });

  it("não altera tarefas no mesmo dia", () => {
    const today = "2026-08-22";
    localStorage.setItem(STORAGE_KEYS.lastFocusDay, today);
    const tasks = [task({ id: "1", elapsed: 90 })];
    expect(rolloverTasksIfNewDay(tasks, today)).toBe(tasks);
  });

  it("primeira execução apenas grava o dia", () => {
    const today = "2026-08-22";
    const tasks = [task({ id: "1", elapsed: 90 })];
    const result = rolloverTasksIfNewDay(tasks, today);
    expect(result).toEqual(tasks);
    expect(loadLastFocusDay()).toBe(today);
  });

  it("zera elapsed de pendentes de dias passados", () => {
    localStorage.setItem(STORAGE_KEYS.lastFocusDay, "2026-08-21");
    const today = "2026-08-22";
    const tasks = [
      task({ id: "past", elapsed: 120, scheduledDate: "2026-08-21" }),
      task({
        id: "done",
        status: "completed",
        elapsed: 300,
        scheduledDate: "2026-08-21",
        completedAt: "2026-08-21T18:00:00.000Z",
      }),
    ];
    const rolled = rolloverTasksIfNewDay(tasks, today);
    expect(rolled.find((t) => t.id === "past")?.elapsed).toBe(0);
    expect(rolled.find((t) => t.id === "done")?.elapsed).toBe(300);
    expect(loadLastFocusDay()).toBe(today);
  });

  it("não toca tarefas de dias futuros", () => {
    localStorage.setItem(STORAGE_KEYS.lastFocusDay, "2026-08-21");
    const today = "2026-08-22";
    const tasks = [
      task({ id: "future", elapsed: 60, scheduledDate: "2026-08-25" }),
    ];
    const rolled = rolloverTasksIfNewDay(tasks, today);
    expect(rolled.find((t) => t.id === "future")?.elapsed).toBe(60);
  });
});
