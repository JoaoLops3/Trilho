import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DAILY_GOAL_MINUTES } from "../daily-goal";

const {
  loadTasks,
  loadHistory,
  loadProfile,
  loadPreferences,
  loadNotifications,
  loadRoutines,
} = vi.hoisted(() => ({
  loadTasks: vi.fn(),
  loadHistory: vi.fn(),
  loadProfile: vi.fn(),
  loadPreferences: vi.fn(),
  loadNotifications: vi.fn(),
  loadRoutines: vi.fn(),
}));

vi.mock("../storage", () => ({ loadTasks }));
vi.mock("../day-stats", () => ({ loadHistory }));
vi.mock("../profile-storage", () => ({
  loadProfile,
  DEFAULT_ACCOUNT_NAME: "Alex",
}));
vi.mock("../notification-preferences", () => ({
  loadPreferences,
  DEFAULT_PREFERENCES: {
    leadMinutes: 10,
    hideTaskContent: false,
    enabled: {},
  },
}));
vi.mock("../notification-storage", () => ({ loadNotifications }));
vi.mock("../routine-storage", () => ({ loadRoutines }));

import { hasMeaningfulLocalData } from "./mappers";

const emptyProfile = {
  accountName: "Alex",
  nickname: null,
  avatarSeed: null,
  avatarStyle: "toon-head" as const,
  dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
};

describe("hasMeaningfulLocalData", () => {
  beforeEach(() => {
    loadTasks.mockReturnValue([]);
    loadHistory.mockReturnValue([]);
    loadProfile.mockReturnValue(emptyProfile);
    loadPreferences.mockReturnValue({ leadMinutes: 10 });
    loadNotifications.mockReturnValue([]);
    loadRoutines.mockReturnValue([]);
  });

  it("retorna false em device zerado", () => {
    expect(hasMeaningfulLocalData()).toBe(false);
  });

  it("retorna true com tarefas locais", () => {
    loadTasks.mockReturnValue([
      {
        id: "1",
        title: "X",
        category: "work",
        duration: 60,
        elapsed: 0,
        status: "pending",
        priority: "medium",
      },
    ]);
    expect(hasMeaningfulLocalData()).toBe(true);
  });

  it("retorna true com nickname customizado", () => {
    loadProfile.mockReturnValue({ ...emptyProfile, nickname: "João" });
    expect(hasMeaningfulLocalData()).toBe(true);
  });
});
