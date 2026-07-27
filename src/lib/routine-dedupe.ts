import type { RoutineTemplate, RoutineTemplateInput } from "../types/routine";

/** Chave estável para comparar rotina candidata vs existente. */
export function routineIdentityKey(
  item: Pick<RoutineTemplateInput, "title" | "duration" | "weekdays" | "scheduledTime">,
): string {
  const title = item.title.trim().toLowerCase();
  const weekdays = [...item.weekdays].sort((a, b) => a - b).join(",");
  const time = item.scheduledTime?.trim() ?? "";
  return `${title}|${item.duration}|${weekdays}|${time}`;
}

export function isSameRoutine(
  a: Pick<RoutineTemplateInput, "title" | "duration" | "weekdays" | "scheduledTime">,
  b: Pick<RoutineTemplateInput, "title" | "duration" | "weekdays" | "scheduledTime">,
): boolean {
  return routineIdentityKey(a) === routineIdentityKey(b);
}

export function findMatchingRoutine(
  item: RoutineTemplateInput,
  existing: RoutineTemplate[],
): RoutineTemplate | undefined {
  return existing.find((routine) => isSameRoutine(item, routine));
}

export interface RoutineDedupeResult {
  /** Itens do preview que ainda não existem. */
  fresh: RoutineTemplateInput[];
  /** Índices no preview que já têm correspondente. */
  duplicateIndexes: number[];
  duplicateCount: number;
  freshCount: number;
  allDuplicates: boolean;
  noneDuplicates: boolean;
}

/**
 * Separa itens novos dos que já existem nas rotinas salvas.
 * Cada rotina existente só "casa" com um item do preview (1:1),
 * para não marcar dois iguais no preview contra o mesmo template.
 */
export function partitionRoutineInputs(
  items: RoutineTemplateInput[],
  existing: RoutineTemplate[],
): RoutineDedupeResult {
  const usedExistingIds = new Set<string>();
  const fresh: RoutineTemplateInput[] = [];
  const duplicateIndexes: number[] = [];

  items.forEach((item, index) => {
    const match = existing.find(
      (routine) =>
        !usedExistingIds.has(routine.id) && isSameRoutine(item, routine),
    );
    if (match) {
      usedExistingIds.add(match.id);
      duplicateIndexes.push(index);
    } else {
      fresh.push(item);
    }
  });

  const duplicateCount = duplicateIndexes.length;
  const freshCount = fresh.length;

  return {
    fresh,
    duplicateIndexes,
    duplicateCount,
    freshCount,
    allDuplicates: items.length > 0 && freshCount === 0,
    noneDuplicates: duplicateCount === 0,
  };
}

export function formatRoutineDedupeMessage(result: RoutineDedupeResult): string {
  if (result.allDuplicates) {
    return "Você já tem essa rotina. Não vamos duplicar — pode ajustar em Minhas rotinas.";
  }
  if (result.duplicateCount === 0) {
    return "";
  }
  const skipped =
    result.duplicateCount === 1
      ? "1 item já existia e foi ignorado"
      : `${result.duplicateCount} itens já existiam e foram ignorados`;
  const added =
    result.freshCount === 1
      ? "1 novo será adicionado"
      : `${result.freshCount} novos serão adicionados`;
  return `${skipped}. ${added}.`;
}
