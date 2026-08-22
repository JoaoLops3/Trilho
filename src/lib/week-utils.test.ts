import { describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import {
  addWeeks,
  formatWeekLabel,
  getWeekDays,
  startOfWeek,
  taskDay,
  weekdayShortLabel,
} from "./week-utils";

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

describe("startOfWeek", () => {
  it("retorna segunda quando weekStartsOn=1 (BR)", () => {
    // 2026-08-22 é sábado
    const monday = startOfWeek(new Date(2026, 7, 22), 1);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(17);
  });
});

describe("getWeekDays", () => {
  it("retorna 7 dayKeys consecutivos", () => {
    const days = getWeekDays(new Date(2026, 7, 22));
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-08-17");
    expect(days[6]).toBe("2026-08-23");
  });
});

describe("addWeeks", () => {
  it("desloca 7 dias por semana", () => {
    const base = new Date(2026, 7, 22);
    const next = addWeeks(base, 1);
    expect(next.getDate()).toBe(29);
  });
});

describe("taskDay", () => {
  it("prioriza scheduledDate sobre routineDate", () => {
    const t = task({
      id: "1",
      scheduledDate: "2026-08-20",
      routineDate: "2026-08-21",
    });
    expect(taskDay(t, "2026-08-22")).toBe("2026-08-20");
  });

  it("usa hoje quando não há datas", () => {
    expect(taskDay(task({ id: "1" }), "2026-08-22")).toBe("2026-08-22");
  });
});

describe("formatWeekLabel", () => {
  it("formata semana dentro do mesmo mês", () => {
    expect(formatWeekLabel(new Date(2026, 7, 22))).toBe("17–23 ago");
  });
});

describe("weekdayShortLabel", () => {
  it("retorna label PT curto", () => {
    expect(weekdayShortLabel("2026-08-22")).toBe("S"); // sábado
  });
});
