import { describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import {
  getOverdueTasks,
  getStreakAtRiskScheduleAt,
  getTimerFinishAt,
  getUpcomingTaskReminders,
  parseScheduledMinutes,
  scheduledDateToday,
} from "./notification-scheduler";

function task(partial: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: "Tarefa",
    category: "work",
    duration: 1800,
    elapsed: 0,
    status: "pending",
    priority: "medium",
    scheduledDate: "2026-08-22",
    ...partial,
  };
}

describe("parseScheduledMinutes", () => {
  it("parseia HH:mm válido", () => {
    expect(parseScheduledMinutes("09:30")).toBe(570);
    expect(parseScheduledMinutes("invalid")).toBeNull();
  });
});

describe("scheduledDateToday", () => {
  it("monta Date no dia corrente", () => {
    const now = new Date(2026, 7, 22, 8, 0, 0);
    const at = scheduledDateToday("09:30", now);
    expect(at?.getHours()).toBe(9);
    expect(at?.getMinutes()).toBe(30);
  });
});

describe("getUpcomingTaskReminders", () => {
  it("inclui tarefa na janela de lead", () => {
    const now = new Date(2026, 7, 22, 9, 25, 0);
    const tasks = [
      task({ id: "1", scheduledTime: "09:30", scheduledDate: "2026-08-22" }),
    ];
    expect(getUpcomingTaskReminders(tasks, now, 10)).toHaveLength(1);
  });
});

describe("getOverdueTasks", () => {
  it("marca pendente após horário", () => {
    const now = new Date(2026, 7, 22, 10, 0, 0);
    const tasks = [
      task({ id: "1", scheduledTime: "09:00", scheduledDate: "2026-08-22" }),
    ];
    expect(getOverdueTasks(tasks, now)).toHaveLength(1);
  });
});

describe("getTimerFinishAt", () => {
  it("calcula fim do timer para tarefa ativa", () => {
    const now = new Date(2026, 7, 22, 10, 0, 0);
    const finish = getTimerFinishAt(
      task({ id: "1", status: "active", duration: 600, elapsed: 120 }),
      now,
    );
    expect(finish?.getTime()).toBe(now.getTime() + 480_000);
  });
});

describe("getStreakAtRiskScheduleAt", () => {
  it("agenda alerta às 20h se há streak e zero conclusões hoje", () => {
    const now = new Date(2026, 7, 22, 15, 0, 0);
    const at = getStreakAtRiskScheduleAt(3, 0, now);
    expect(at?.getHours()).toBe(20);
  });

  it("não agenda se já concluiu hoje", () => {
    const now = new Date(2026, 7, 22, 15, 0, 0);
    expect(getStreakAtRiskScheduleAt(3, 1, now)).toBeNull();
  });
});
