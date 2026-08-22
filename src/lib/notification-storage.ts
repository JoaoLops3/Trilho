import type { AppNotification } from "../types/notification";

import { appNotificationSchema } from "./storage-schemas";
import { parseStorageArray } from "./storage-runtime";
import { STORAGE_KEYS } from "./storage-keys";

const STORAGE_KEY = STORAGE_KEYS.notifications;
const MAX_ITEMS = 50;

export function loadNotifications(): AppNotification[] {
  try {
    return (
      parseStorageArray(
        localStorage.getItem(STORAGE_KEY),
        appNotificationSchema,
        { storageKey: STORAGE_KEY, operation: "load_notifications" },
      ) ?? []
    );
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Storage indisponível (modo privado, cota cheia): ignora silenciosamente.
  }
}

/** Ordena por data (mais recente primeiro) e limita ao máximo de itens. */
function normalize(notifications: AppNotification[]): AppNotification[] {
  return [...notifications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_ITEMS);
}

export type NewNotification = Omit<
  AppNotification,
  "id" | "createdAt" | "read"
>;

/**
 * Adiciona uma notificação evitando duplicatas via `dedupKey`.
 * Retorna a lista atualizada (ou a mesma referência se já existia).
 */
export function addNotification(
  current: AppNotification[],
  entry: NewNotification,
  now: Date = new Date(),
): AppNotification[] {
  if (current.some((n) => n.dedupKey === entry.dedupKey)) {
    return current;
  }
  const notification: AppNotification = {
    ...entry,
    id: `${entry.dedupKey}:${now.getTime()}`,
    createdAt: now.toISOString(),
    read: false,
  };
  return normalize([notification, ...current]);
}

export function markAsRead(
  current: AppNotification[],
  id: string,
): AppNotification[] {
  return current.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export function markAllAsRead(current: AppNotification[]): AppNotification[] {
  return current.map((n) => (n.read ? n : { ...n, read: true }));
}
