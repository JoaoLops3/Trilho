import { describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import {
  computeFocusSeconds,
  computeGoalPercent,
  computeRecordStreak,
  computeStreak,
  computeTodayCompletedCount,
  computeWeekDots,
  dayKey,
  filterTodayAgendaTasks,
  formatFocusTime,
  isTaskCompletedOnDay,
  sortByScheduledTime,
} from "./day-stats";

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

describe("dayKey", () => {
  it("formata YYYY-MM-DD em horário local", () => {
    expect(dayKey(new Date(2026, 7, 22))).toBe("2026-08-22");
  });
});

describe("computeStreak", () => {
  it("retorna 0 sem dias concluídos", () => {
    expect(computeStreak([], "2026-08-22")).toBe(0);
  });

  it("conta dias consecutivos terminando hoje", () => {
    const history = [
      { date: "2026-08-20", tasksCompleted: 1, focusSeconds: 60 },
      { date: "2026-08-21", tasksCompleted: 2, focusSeconds: 120 },
      { date: "2026-08-22", tasksCompleted: 1, focusSeconds: 90 },
    ];
    expect(computeStreak(history, "2026-08-22")).toBe(3);
  });

  it("não quebra streak se hoje ainda não tem conclusão", () => {
    const history = [
      { date: "2026-08-20", tasksCompleted: 1, focusSeconds: 60 },
      { date: "2026-08-21", tasksCompleted: 1, focusSeconds: 60 },
    ];
    expect(computeStreak(history, "2026-08-22")).toBe(2);
  });
});

describe("computeRecordStreak", () => {
  it("retorna maior sequência no histórico", () => {
    const history = [
      { date: "2026-08-01", tasksCompleted: 1, focusSeconds: 0 },
      { date: "2026-08-02", tasksCompleted: 1, focusSeconds: 0 },
      { date: "2026-08-05", tasksCompleted: 1, focusSeconds: 0 },
      { date: "2026-08-06", tasksCompleted: 1, focusSeconds: 0 },
      { date: "2026-08-07", tasksCompleted: 1, focusSeconds: 0 },
    ];
    expect(computeRecordStreak(history)).toBe(3);
  });
});

describe("computeWeekDots", () => {
  it("marca hoje como partial quando há conclusões parciais", () => {
    const today = "2026-08-22";
    const tasks = [
      task({
        id: "1",
        status: "completed",
        completedAt: `${today}T10:00:00.000Z`,
      }),
      task({ id: "2", status: "pending", scheduledDate: today }),
    ];
    const dots = computeWeekDots([], tasks, today);
    expect(dots[dots.length - 1]).toEqual({ status: "today-partial" });
  });

  it("marca dias passados vazios sem histórico", () => {
    const dots = computeWeekDots([], [], "2026-08-22");
    expect(dots.filter((d) => d.status === "empty").length).toBeGreaterThan(0);
  });
});

describe("computeGoalPercent", () => {
  it("retorna 0 quando meta é inválida", () => {
    expect(computeGoalPercent(30, 0)).toBe(0);
  });

  it("limita em 100%", () => {
    expect(computeGoalPercent(200, 60)).toBe(100);
  });
});

describe("formatFocusTime", () => {
  it("formata só minutos ou horas", () => {
    expect(formatFocusTime(45)).toBe("45m");
    expect(formatFocusTime(90)).toBe("1h 30m");
  });
});

describe("sortByScheduledTime", () => {
  it("ordena por horário e joga sem horário pro fim", () => {
    const sorted = sortByScheduledTime([
      task({ id: "late", scheduledTime: "14:00" }),
      task({ id: "none" }),
      task({ id: "early", scheduledTime: "08:30" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["early", "late", "none"]);
  });
});

describe("isTaskCompletedOnDay / agenda", () => {
  const today = "2026-08-22";

  it("identifica conclusão no dia correto", () => {
    const completed = task({
      id: "c",
      status: "completed",
      completedAt: `${today}T12:00:00.000Z`,
    });
    expect(isTaskCompletedOnDay(completed, today)).toBe(true);
  });

  it("filtra agenda do dia", () => {
    const tasks = [
      task({ id: "today", scheduledDate: today }),
      task({ id: "other", scheduledDate: "2026-08-21" }),
    ];
    expect(filterTodayAgendaTasks(tasks, today)).toHaveLength(1);
    expect(computeTodayCompletedCount(tasks, today)).toBe(0);
  });
});

describe("computeFocusSeconds", () => {
  it("soma elapsed de ativas e concluídas hoje", () => {
    const today = "2026-08-22";
    const tasks = [
      task({ id: "a", status: "active", elapsed: 120 }),
      task({
        id: "b",
        status: "completed",
        elapsed: 300,
        completedAt: `${today}T09:00:00.000Z`,
      }),
      task({
        id: "c",
        status: "completed",
        elapsed: 999,
        completedAt: "2026-08-21T09:00:00.000Z",
      }),
    ];
    expect(computeFocusSeconds(tasks, today)).toBe(420);
  });
});
