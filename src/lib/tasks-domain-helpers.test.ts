import { describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import {
  applyCompletion,
  getWallClockElapsed,
  type ActiveSession,
} from "./tasks-domain-helpers";

function makeTask(partial: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: "Teste",
    category: "geral",
    priority: "medium",
    duration: 600,
    elapsed: 0,
    status: "pending",
    ...partial,
  };
}

describe("getWallClockElapsed", () => {
  it("retorna elapsed persistido sem sessão ativa", () => {
    const task = makeTask({ id: "1", elapsed: 42, status: "paused" });
    expect(getWallClockElapsed(task, null)).toBe(42);
  });

  it("soma delta da sessão para tarefa active", () => {
    const task = makeTask({ id: "1", elapsed: 10, status: "active" });
    const session: ActiveSession = {
      taskId: "1",
      startedAtMs: Date.now() - 5_000,
      elapsedAtStart: 10,
    };
    const live = getWallClockElapsed(task, session);
    expect(live).toBeGreaterThanOrEqual(14);
    expect(live).toBeLessThanOrEqual(16);
  });
});

describe("applyCompletion", () => {
  it("preenche completedAt na primeira conclusão", () => {
    const task = makeTask({ id: "1", status: "active" });
    const done = applyCompletion(task, "completed", { elapsed: 600 });
    expect(done.status).toBe("completed");
    expect(done.completedAt).toBeTruthy();
    expect(done.elapsed).toBe(600);
  });

  it("não sobrescreve completedAt existente", () => {
    const task = makeTask({
      id: "1",
      status: "completed",
      completedAt: "2026-01-01T00:00:00.000Z",
    });
    const again = applyCompletion(task, "completed");
    expect(again.completedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
