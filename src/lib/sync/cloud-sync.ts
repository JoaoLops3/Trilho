import type { Task } from "../../components/TaskCard";
import type { DayStat } from "../day-stats";
import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
} from "../notification-preferences";
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  mergeDailyGoalMinutes,
} from "../daily-goal";
import { loadProfile } from "../profile-storage";
import { getSupabase } from "../supabase";
import { pruneCompletedTasks } from "../storage";
import type { UserProfile } from "../../types/avatar";
import type { AppNotification } from "../../types/notification";
import {
  dayStatToRow,
  notificationToRow,
  profileToEditableRow,
  routineToRow,
  rowToDayStat,
  rowToNotification,
  rowToProfile,
  rowToRoutine,
  rowToTask,
  taskToRow,
} from "./mappers";
import type { Json, ProfileRow } from "../../types/database";
import type { RoutineTemplate } from "../../types/routine";
import type { UserDataSnapshot } from "./mappers";
import { assertNoSyncError } from "./assert-no-sync-error";

function mergePreferences(
  partial?: Partial<NotificationPreferences>,
): NotificationPreferences {
  if (!partial) return DEFAULT_PREFERENCES;
  return {
    leadMinutes: partial.leadMinutes ?? DEFAULT_PREFERENCES.leadMinutes,
    hideTaskContent:
      partial.hideTaskContent ?? DEFAULT_PREFERENCES.hideTaskContent,
    enabled: {
      ...DEFAULT_PREFERENCES.enabled,
      ...(partial.enabled ?? {}),
    },
  };
}

async function countForUser(table: string, userId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

export async function fetchProfileMeta(
  userId: string,
): Promise<ProfileRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, nickname, avatar_seed, avatar_style, daily_goal_minutes, local_import_done",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function hasCloudData(userId: string): Promise<boolean> {
  const profile = await fetchProfileMeta(userId);
  if (profile?.local_import_done) return true;

  const [tasks, history, notifications] = await Promise.all([
    countForUser("tasks", userId),
    countForUser("day_history", userId),
    countForUser("notifications", userId),
  ]);

  return tasks > 0 || history > 0 || notifications > 0;
}

export async function pullUserSnapshot(
  userId: string,
): Promise<UserDataSnapshot> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase não configurado");
  }

  const [
    profileRes,
    tasksRes,
    historyRes,
    prefsRes,
    notificationsRes,
    routinesRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, nickname, avatar_seed, avatar_style, daily_goal_minutes, local_import_done",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("day_history").select("*").eq("user_id", userId),
    supabase
      .from("notification_preferences")
      .select("prefs")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("routine_templates").select("*").eq("user_id", userId),
  ]);

  // Pull com erro não pode virar snapshot vazio — applySnapshot sobrescreveria
  // o cache local com nada.
  assertNoSyncError(profileRes.error, "pull profiles");
  assertNoSyncError(tasksRes.error, "pull tasks");
  assertNoSyncError(historyRes.error, "pull day_history");
  assertNoSyncError(prefsRes.error, "pull notification_preferences");
  assertNoSyncError(notificationsRes.error, "pull notifications");
  assertNoSyncError(routinesRes.error, "pull routine_templates");

  const profileRow = profileRes.data as ProfileRow | null;
  const localProfile = loadProfile();

  const remoteProfile: UserProfile = profileRow
    ? rowToProfile(profileRow)
    : {
        accountName: "Alex",
        nickname: null,
        avatarSeed: null,
        avatarStyle: "toon-head",
        dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
      };

  return {
    tasks: (tasksRes.data ?? []).map((row) => rowToTask(row)),
    history: (historyRes.data ?? []).map((row) => rowToDayStat(row)),
    profile: {
      ...remoteProfile,
      dailyGoalMinutes: mergeDailyGoalMinutes(
        localProfile.dailyGoalMinutes,
        profileRow?.daily_goal_minutes ?? remoteProfile.dailyGoalMinutes,
      ),
    },
    preferences: mergePreferences(
      prefsRes.data?.prefs as Partial<NotificationPreferences> | undefined,
    ),
    notifications: (notificationsRes.data ?? []).map((row) =>
      rowToNotification(row),
    ),
    routines: (routinesRes.data ?? []).map((row) => rowToRoutine(row)),
    localImportDone: profileRow?.local_import_done ?? false,
  };
}

export async function markLocalImportDone(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("profiles")
    .update({ local_import_done: true })
    .eq("id", userId);
  assertNoSyncError(error, "markLocalImportDone");
}

export async function pushUserSnapshot(
  userId: string,
  snapshot: UserDataSnapshot,
  markImportDone = false,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const tasks = pruneCompletedTasks(snapshot.tasks);

  await syncTasksToCloud(userId, tasks);
  await syncHistoryToCloud(userId, snapshot.history);
  await syncNotificationsToCloud(userId, snapshot.notifications);
  await syncPreferencesToCloud(userId, snapshot.preferences);
  await syncRoutinesToCloud(userId, snapshot.routines);

  const { error } = await supabase
    .from("profiles")
    .update(
      profileToEditableRow(
        snapshot.profile,
        markImportDone || snapshot.localImportDone,
      ),
    )
    .eq("id", userId);
  assertNoSyncError(error, "push profiles");
}

export async function syncTasksToCloud(
  userId: string,
  tasks: Task[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const pruned = pruneCompletedTasks(tasks);
  const rows = pruned.map((task) => taskToRow(task, userId));
  const ids = new Set(pruned.map((task) => task.id));

  if (rows.length > 0) {
    const { error } = await supabase.from("tasks").upsert(rows);
    assertNoSyncError(error, "upsert tasks");
  }

  const { data: existing, error: selectError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId);
  assertNoSyncError(selectError, "select tasks");

  const staleIds =
    existing
      ?.filter((row) => !ids.has(row.id as string))
      .map((row) => row.id as string) ?? [];

  if (staleIds.length > 0) {
    const { error } = await supabase.from("tasks").delete().in("id", staleIds);
    assertNoSyncError(error, "delete tasks");
  }
}

export async function syncRoutinesToCloud(
  userId: string,
  routines: RoutineTemplate[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const rows = routines.map((routine) => routineToRow(routine, userId));
  const ids = new Set(routines.map((routine) => routine.id));

  if (rows.length > 0) {
    const { error } = await supabase.from("routine_templates").upsert(rows);
    assertNoSyncError(error, "upsert routine_templates");
  }

  const { data: existing, error: selectError } = await supabase
    .from("routine_templates")
    .select("id")
    .eq("user_id", userId);
  assertNoSyncError(selectError, "select routine_templates");

  const staleIds =
    existing
      ?.filter((row) => !ids.has(row.id as string))
      .map((row) => row.id as string) ?? [];

  if (staleIds.length > 0) {
    const { error } = await supabase
      .from("routine_templates")
      .delete()
      .in("id", staleIds);
    assertNoSyncError(error, "delete routine_templates");
  }
}

export async function syncHistoryToCloud(
  userId: string,
  history: DayStat[],
): Promise<void> {
  const supabase = getSupabase();
  // Histórico local vazio pode ser device novo pré-pull: não deletar nada
  // do remoto nesse caso (o diff abaixo só roda com histórico não vazio).
  if (!supabase || history.length === 0) return;

  const rows = history.map((entry) => dayStatToRow(entry, userId));
  const dates = new Set(history.map((entry) => entry.date));

  const { error: upsertError } = await supabase
    .from("day_history")
    .upsert(rows);
  assertNoSyncError(upsertError, "upsert day_history");

  const { data: existing, error: selectError } = await supabase
    .from("day_history")
    .select("date")
    .eq("user_id", userId);
  assertNoSyncError(selectError, "select day_history");

  const staleDates =
    existing
      ?.filter((row) => !dates.has(row.date as string))
      .map((row) => row.date as string) ?? [];

  if (staleDates.length > 0) {
    const { error } = await supabase
      .from("day_history")
      .delete()
      .eq("user_id", userId)
      .in("date", staleDates);
    assertNoSyncError(error, "delete day_history");
  }
}

export async function syncProfileToCloud(
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const meta = await fetchProfileMeta(userId);

  const { error } = await supabase
    .from("profiles")
    .update(profileToEditableRow(profile, meta?.local_import_done ?? false))
    .eq("id", userId);
  assertNoSyncError(error, "push profile");
}

export async function syncPreferencesToCloud(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      prefs: preferences as unknown as Json,
    },
    { onConflict: "user_id" },
  );
  assertNoSyncError(error, "upsert notification_preferences");
}

export async function syncNotificationsToCloud(
  userId: string,
  notifications: AppNotification[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const byDedup = new Map<string, AppNotification>();
  for (const notification of notifications) {
    byDedup.set(notification.dedupKey, notification);
  }
  const unique = [...byDedup.values()];
  const rows = unique.map((n) => notificationToRow(n, userId));
  const dedupKeys = new Set(unique.map((n) => n.dedupKey));

  if (rows.length > 0) {
    const { error } = await supabase.from("notifications").upsert(rows, {
      onConflict: "user_id,dedup_key",
    });
    assertNoSyncError(error, "upsert notifications");
  }

  const { data: existing, error: selectError } = await supabase
    .from("notifications")
    .select("id, dedup_key")
    .eq("user_id", userId);
  assertNoSyncError(selectError, "select notifications");

  const staleIds =
    existing
      ?.filter((row) => !dedupKeys.has(row.dedup_key as string))
      .map((row) => row.id as string) ?? [];

  if (staleIds.length > 0) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", staleIds);
    assertNoSyncError(error, "delete notifications");
  }
}
