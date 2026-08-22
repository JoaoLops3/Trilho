import type { z } from "zod";

import { reportError } from "./observability";

export interface StorageParseContext {
  /** Chave localStorage — só para telemetria, sem expor conteúdo. */
  storageKey: string;
  operation: string;
}

function reportStorageParseIssue(
  message: string,
  context: StorageParseContext,
): void {
  reportError(new Error(message), {
    surface: "storage",
    operation: context.operation,
  });
}

/** Parse JSON bruto; null = ausente, undefined = JSON inválido. */
export function parseStorageJson(
  raw: string | null,
): unknown | null | undefined {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Valida array persistido item a item. Entradas inválidas são descartadas;
 * telemetria registra corrupção parcial sem derrubar dados válidos.
 */
export function parseStorageArray<T>(
  raw: string | null,
  itemSchema: z.ZodType<T>,
  context: StorageParseContext,
): T[] | null {
  const parsed = parseStorageJson(raw);
  if (parsed === null) return null;
  if (parsed === undefined) {
    reportStorageParseIssue(`JSON inválido (${context.storageKey})`, context);
    return null;
  }
  if (!Array.isArray(parsed)) {
    reportStorageParseIssue(
      `Formato inválido: esperado array (${context.storageKey})`,
      context,
    );
    return null;
  }

  const valid: T[] = [];
  let invalidCount = 0;
  for (const item of parsed) {
    const result = itemSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalidCount += 1;
    }
  }

  if (invalidCount > 0) {
    reportStorageParseIssue(
      `${invalidCount} entradas inválidas descartadas (${context.storageKey})`,
      context,
    );
  }

  return valid;
}

/** Valida objeto único; null = ausente, fallback quando JSON ou schema falham. */
export function parseStorageObject<T>(
  raw: string | null,
  objectSchema: z.ZodType<T>,
  context: StorageParseContext,
  fallback: T,
): T {
  const parsed = parseStorageJson(raw);
  if (parsed === null) return fallback;
  if (parsed === undefined) {
    reportStorageParseIssue(`JSON inválido (${context.storageKey})`, context);
    return fallback;
  }

  const result = objectSchema.safeParse(parsed);
  if (!result.success) {
    reportStorageParseIssue(`Schema inválido (${context.storageKey})`, context);
    return fallback;
  }

  return result.data;
}
