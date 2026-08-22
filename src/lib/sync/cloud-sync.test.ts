import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../../types/task";
import { authError, createSupabaseMock } from "../../test/supabase-mock";
import {
  pullUserSnapshot,
  syncHistoryToCloud,
  syncTasksToCloud,
} from "./cloud-sync";

const getSupabaseMock = vi.fn();

vi.mock("../supabase", () => ({
  getSupabase: () => getSupabaseMock(),
}));

vi.mock("../profile-storage", () => ({
  loadProfile: () => ({
    accountName: "Alex",
    nickname: null,
    avatarSeed: null,
    avatarStyle: "toon-head",
    dailyGoalMinutes: 180,
  }),
  DEFAULT_ACCOUNT_NAME: "Alex",
}));

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

describe("syncTasksToCloud", () => {
  beforeEach(() => {
    getSupabaseMock.mockReset();
  });

  it("upserta tarefas e remove ids obsoletos no remoto", async () => {
    const { client, calls } = createSupabaseMock({
      tasks: {
        upsert: { error: null },
        select: { data: [{ id: "stale-1" }], error: null },
        delete: { error: null },
      },
    });
    getSupabaseMock.mockReturnValue(client);

    await syncTasksToCloud("user-1", [task({ id: "keep-1" })]);

    expect(calls.some((c) => c.op === "upsert")).toBe(true);
    expect(calls.some((c) => c.op === "delete.in")).toBe(true);
  });

  it("propaga erro de upsert via assertNoSyncError", async () => {
    const { client } = createSupabaseMock({
      tasks: {
        upsert: { error: authError("timeout") },
      },
    });
    getSupabaseMock.mockReturnValue(client);

    await expect(
      syncTasksToCloud("user-1", [task({ id: "t1" })]),
    ).rejects.toThrow("sync upsert tasks: timeout");
  });
});

describe("syncHistoryToCloud", () => {
  beforeEach(() => {
    getSupabaseMock.mockReset();
  });

  it("não chama Supabase quando histórico local está vazio", async () => {
    const { client, calls } = createSupabaseMock({});
    getSupabaseMock.mockReturnValue(client);

    await syncHistoryToCloud("user-1", []);

    expect(calls).toHaveLength(0);
  });

  it("upserta entradas quando há histórico", async () => {
    const { client, calls } = createSupabaseMock({
      day_history: {
        upsert: { error: null },
        select: { data: [], error: null },
      },
    });
    getSupabaseMock.mockReturnValue(client);

    await syncHistoryToCloud("user-1", [
      { date: "2026-08-22", tasksCompleted: 2, focusSeconds: 120 },
    ]);

    expect(
      calls.some((c) => c.table === "day_history" && c.op === "upsert"),
    ).toBe(true);
  });
});

describe("pullUserSnapshot", () => {
  beforeEach(() => {
    getSupabaseMock.mockReset();
  });

  it("não retorna snapshot vazio quando pull de tasks falha", async () => {
    const profileRow = {
      id: "user-1",
      display_name: "Alex",
      nickname: null,
      avatar_seed: null,
      avatar_style: "toon-head",
      daily_goal_minutes: 180,
      local_import_done: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    getSupabaseMock.mockReturnValue({
      from: (table: string) => {
        const emptyList = {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };

        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: profileRow, error: null }),
              }),
            }),
          };
        }
        if (table === "tasks") {
          return {
            select: () => ({
              eq: async () => ({
                data: null,
                error: authError("network down"),
              }),
            }),
          };
        }
        if (table === "notification_preferences") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === "notifications") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return emptyList;
      },
    });

    await expect(pullUserSnapshot("user-1")).rejects.toThrow(
      "sync pull tasks: network down",
    );
  });
});
