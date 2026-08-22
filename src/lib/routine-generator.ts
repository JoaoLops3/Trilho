import type { Task } from "../types/task";
import type { RoutineTemplate } from "../types/routine";
import { dayKey } from "./day-stats";

/** Id determinístico da instância: dedup natural entre devices (PK no upsert). */
export function routineInstanceId(templateId: string, date: string): string {
  return `${templateId}:${date}`;
}

function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00`).getDay();
}

export function generateRoutineInstances(
  tasks: Task[],
  routines: RoutineTemplate[],
  today: string = dayKey(),
): Task[] {
  const byId = new Map(routines.map((routine) => [routine.id, routine]));
  const weekday = weekdayOf(today);

  const kept = tasks.filter((task) => {
    if (!task.routineTemplateId) return true; // tarefa avulsa
    if (task.status === "completed") return true; // preserva histórico
    if (task.routineDate !== today) return false; // dia passado não concluído → limpa
    return byId.has(task.routineTemplateId); // template excluído → remove instância pendente
  });

  const existing = new Set(
    kept
      .filter((task) => task.routineTemplateId && task.routineDate === today)
      .map((task) => task.routineTemplateId as string),
  );

  const additions: Task[] = [];
  for (const routine of routines) {
    if (!routine.active) continue;
    if (!routine.weekdays.includes(weekday)) continue;
    if (existing.has(routine.id)) continue;

    additions.push({
      id: routineInstanceId(routine.id, today),
      title: routine.title,
      category: routine.category,
      duration: routine.duration,
      elapsed: 0,
      status: "pending",
      priority: routine.priority,
      scheduledTime: routine.scheduledTime,
      routineTemplateId: routine.id,
      routineDate: today,
    });
  }

  if (additions.length === 0 && kept.length === tasks.length) return tasks;
  return [...kept, ...additions];
}
