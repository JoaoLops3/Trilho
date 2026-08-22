import { describe, expect, it } from "vitest";
import type { Task } from "../../types/task";
import type { TaskRow } from "../../types/database";
import {
  profileToEditableRow,
  rowToProfile,
  rowToTask,
  taskToRow,
} from "./mappers";
import { DEFAULT_ACCOUNT_NAME } from "../profile-storage";

const USER_ID = "user-123";

describe("task mappers", () => {
  const task: Task = {
    id: "task-1",
    title: "Estudar",
    category: "study",
    duration: 25,
    elapsed: 600,
    status: "paused",
    priority: "high",
    scheduledTime: "09:30",
    scheduledDate: "2026-08-22",
    routineTemplateId: "routine-1",
    routineDate: "2026-08-22",
  };

  it("taskToRow mapeia campos snake_case", () => {
    const row = taskToRow(task, USER_ID);
    expect(row.user_id).toBe(USER_ID);
    expect(row.scheduled_time).toBe("09:30");
    expect(row.routine_template_id).toBe("routine-1");
  });

  it("rowToTask reverte nullable para undefined", () => {
    const row: TaskRow = {
      id: task.id,
      user_id: USER_ID,
      title: task.title,
      category: task.category,
      duration: task.duration,
      elapsed: task.elapsed,
      status: task.status,
      priority: task.priority,
      scheduled_time: "09:30",
      scheduled_date: "2026-08-22",
      completed_at: null,
      routine_template_id: "routine-1",
      routine_date: "2026-08-22",
      created_at: "2026-08-22T10:00:00.000Z",
      updated_at: "2026-08-22T12:00:00.000Z",
    };
    expect(rowToTask(row)).toMatchObject({
      scheduledTime: "09:30",
      completedAt: undefined,
    });
  });

  it("roundtrip preserva dados principais", () => {
    const row = taskToRow(task, USER_ID);
    const back = rowToTask(row as TaskRow);
    expect(back.title).toBe(task.title);
    expect(back.scheduledDate).toBe(task.scheduledDate);
  });
});

describe("profile mappers", () => {
  it("profileToEditableRow usa nome default quando vazio", () => {
    const row = profileToEditableRow(
      {
        accountName: "   ",
        nickname: "João",
        avatarSeed: "seed",
        avatarStyle: "toon-head",
        dailyGoalMinutes: 180,
      },
      true,
    );
    expect(row.display_name).toBe(DEFAULT_ACCOUNT_NAME);
  });

  it("rowToProfile faz fallback de avatar desconhecido", () => {
    const profile = rowToProfile({
      id: USER_ID,
      display_name: "Alex",
      nickname: null,
      avatar_seed: null,
      avatar_style: "unknown-style",
      daily_goal_minutes: 180,
      local_import_done: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(profile.avatarStyle).toBe("toon-head");
  });
});
