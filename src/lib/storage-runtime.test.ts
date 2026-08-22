import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "./storage-keys";
import { taskSchema } from "./storage-schemas";
import {
  parseStorageArray,
  parseStorageJson,
  parseStorageObject,
} from "./storage-runtime";
import { userProfileSchema } from "./storage-schemas";
import { loadTasks, saveTasks } from "./storage";
import { installLocalStorageMock } from "../test/local-storage-mock";

vi.mock("./observability", () => ({
  reportError: vi.fn(),
}));

describe("parseStorageJson", () => {
  it("retorna null quando ausente", () => {
    expect(parseStorageJson(null)).toBeNull();
  });

  it("retorna undefined quando JSON inválido", () => {
    expect(parseStorageJson("{")).toBeUndefined();
  });

  it("parseia JSON válido", () => {
    expect(parseStorageJson('["a"]')).toEqual(["a"]);
  });
});

describe("parseStorageArray", () => {
  const context = { storageKey: "test-key", operation: "test" };

  const validTask = {
    id: "1",
    title: "Foco",
    category: "study",
    duration: 25,
    elapsed: 0,
    status: "pending",
    priority: "medium",
  };

  it("retorna null quando vazio", () => {
    expect(parseStorageArray(null, taskSchema, context)).toBeNull();
  });

  it("aceita entradas válidas", () => {
    const result = parseStorageArray(
      JSON.stringify([validTask]),
      taskSchema,
      context,
    );
    expect(result).toHaveLength(1);
    expect(result?.[0]?.title).toBe("Foco");
  });

  it("descarta entradas inválidas e mantém válidas", () => {
    const result = parseStorageArray(
      JSON.stringify([validTask, { id: "bad" }]),
      taskSchema,
      context,
    );
    expect(result).toHaveLength(1);
  });

  it("retorna null quando não é array", () => {
    expect(parseStorageArray("{}", taskSchema, context)).toBeNull();
  });
});

describe("parseStorageObject", () => {
  const context = { storageKey: "profile", operation: "load_profile" };
  const fallback = {
    accountName: "Alex",
    nickname: null,
    avatarSeed: null,
    avatarStyle: "toon-head" as const,
    dailyGoalMinutes: 180,
  };

  it("usa fallback quando ausente", () => {
    expect(
      parseStorageObject(null, userProfileSchema, context, fallback),
    ).toEqual(fallback);
  });

  it("valida objeto persistido", () => {
    const profile = {
      ...fallback,
      nickname: "João",
    };
    expect(
      parseStorageObject(
        JSON.stringify(profile),
        userProfileSchema,
        context,
        fallback,
      ).nickname,
    ).toBe("João");
  });
});

describe("loadTasks / saveTasks", () => {
  let restoreStorage: () => void;

  beforeEach(() => {
    ({ restore: restoreStorage } = installLocalStorageMock());
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreStorage();
  });

  it("loadTasks retorna null sem dados", () => {
    expect(loadTasks()).toBeNull();
  });

  it("roundtrip persiste tarefas válidas", () => {
    const tasks = [
      {
        id: "t1",
        title: "Estudar",
        category: "study",
        duration: 30,
        elapsed: 0,
        status: "pending" as const,
        priority: "high" as const,
      },
    ];
    saveTasks(tasks);
    expect(loadTasks()).toEqual(tasks);
  });

  it("loadTasks ignora tarefa corrompida e mantém válida", () => {
    localStorage.setItem(
      STORAGE_KEYS.tasks,
      JSON.stringify([
        {
          id: "ok",
          title: "Ok",
          category: "work",
          duration: 10,
          elapsed: 0,
          status: "pending",
          priority: "low",
        },
        { foo: "bar" },
      ]),
    );
    const loaded = loadTasks();
    expect(loaded).toHaveLength(1);
    expect(loaded?.[0]?.id).toBe("ok");
  });
});
