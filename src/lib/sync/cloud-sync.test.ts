import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../../types/task";
import { authError, createSupabaseMock } from "../../test/supabase-mock";
import {
  hasCloudData,
  pullUserSnapshot,
  pushUserSnapshot,
  syncHistoryToCloud,
  syncNotificationsToCloud,
  syncTasksToCloud,
} from "./cloud-sync";
import { DEFAULT_PREFERENCES } from "../notification-preferences";

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
        selectResolvesOnEq: true,
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
        selectResolvesOnEq: true,
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

  it("mapeia snapshot remoto em caso de sucesso", async () => {
    const profileRow = {
      id: "user-1",
      display_name: "Maria",
      nickname: "M",
      avatar_seed: "seed",
      avatar_style: "toon-head",
      daily_goal_minutes: 240,
      local_import_done: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const taskRow = {
      id: "t1",
      user_id: "user-1",
      title: "Foco",
      category: "work",
      duration: 1500,
      elapsed: 0,
      status: "pending" as const,
      priority: "medium" as const,
      scheduled_time: null,
      scheduled_date: "2026-08-22",
      completed_at: null,
      routine_template_id: null,
      routine_date: null,
      created_at: "2026-08-22T10:00:00.000Z",
      updated_at: "2026-08-22T10:00:00.000Z",
    };

    getSupabaseMock.mockReturnValue({
      from: (table: string) => {
        const listEq = (data: unknown[]) => ({
          select: () => ({
            eq: async () => ({ data, error: null }),
          }),
        });

        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: profileRow, error: null }),
              }),
            }),
          };
        }
        if (table === "tasks") return listEq([taskRow]);
        if (table === "day_history") return listEq([]);
        if (table === "routine_templates") return listEq([]);
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
        return listEq([]);
      },
    });

    const snapshot = await pullUserSnapshot("user-1");
    expect(snapshot.tasks).toHaveLength(1);
    expect(snapshot.tasks[0].title).toBe("Foco");
    expect(snapshot.profile.accountName).toBe("Maria");
    expect(snapshot.localImportDone).toBe(true);
  });
});

describe("hasCloudData", () => {
  beforeEach(() => {
    getSupabaseMock.mockReset();
  });

  it("retorna true quando local_import_done no perfil", async () => {
    getSupabaseMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "user-1",
                display_name: "Alex",
                nickname: null,
                avatar_seed: null,
                avatar_style: "toon-head",
                daily_goal_minutes: 180,
                local_import_done: true,
                created_at: "2026-01-01T00:00:00.000Z",
                updated_at: "2026-01-01T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    expect(await hasCloudData("user-1")).toBe(true);
  });

  it("consulta contagem quando perfil ainda não importou", async () => {
    const { client, calls } = createSupabaseMock({
      profiles: {
        select: { data: null, error: null },
      },
      tasks: {
        count: { count: 2, error: null },
      },
      day_history: {
        count: { count: 0, error: null },
      },
      notifications: {
        count: { count: 0, error: null },
      },
    });
    getSupabaseMock.mockReturnValue(client);

    expect(await hasCloudData("user-1")).toBe(true);
    expect(calls.some((c) => c.table === "tasks" && c.op === "select")).toBe(
      true,
    );
  });
});

describe("pushUserSnapshot", () => {
  beforeEach(() => {
    getSupabaseMock.mockReset();
  });

  it("executa push de tasks e atualiza perfil", async () => {
    const { client, calls } = createSupabaseMock({
      tasks: {
        upsert: { error: null },
        select: { data: [], error: null },
        selectResolvesOnEq: true,
      },
      notification_preferences: {
        upsert: { error: null },
      },
      profiles: {
        update: { error: null },
      },
    });
    getSupabaseMock.mockReturnValue(client);

    await pushUserSnapshot(
      "user-1",
      {
        tasks: [task({ id: "t1" })],
        history: [],
        profile: {
          accountName: "Maria",
          nickname: null,
          avatarSeed: null,
          avatarStyle: "toon-head",
          dailyGoalMinutes: 180,
        },
        preferences: DEFAULT_PREFERENCES,
        notifications: [],
        routines: [],
        localImportDone: false,
      },
      false,
    );

    expect(calls.some((c) => c.table === "tasks" && c.op === "upsert")).toBe(
      true,
    );
    expect(calls.some((c) => c.table === "profiles" && c.op === "update")).toBe(
      true,
    );
  });
});

describe("syncNotificationsToCloud", () => {
  beforeEach(() => {
    getSupabaseMock.mockReset();
  });

  it("deduplica por dedupKey antes do upsert", async () => {
    const { client, calls } = createSupabaseMock({
      notifications: {
        upsert: { error: null },
        select: { data: [], error: null },
        selectResolvesOnEq: true,
      },
    });
    getSupabaseMock.mockReturnValue(client);

    await syncNotificationsToCloud("user-1", [
      {
        id: "n1",
        type: "task_completed",
        title: "A",
        body: "B",
        createdAt: "2026-08-22T10:00:00.000Z",
        read: false,
        dedupKey: "same-key",
        taskId: "t1",
      },
      {
        id: "n2",
        type: "task_completed",
        title: "A2",
        body: "B2",
        createdAt: "2026-08-22T11:00:00.000Z",
        read: false,
        dedupKey: "same-key",
        taskId: "t1",
      },
    ]);

    const upsertCall = calls.find(
      (c) => c.table === "notifications" && c.op === "upsert",
    );
    expect(upsertCall).toBeDefined();
    const rows = upsertCall?.payload as { dedup_key: string }[];
    expect(rows).toHaveLength(1);
  });
});
