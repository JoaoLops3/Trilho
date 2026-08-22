export type TaskStatus = "active" | "pending" | "paused" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  category: string;
  duration: number;
  elapsed: number;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledTime?: string;
  /** Dia agendado "YYYY-MM-DD" (tarefa avulsa). Ausente = dia corrente. */
  scheduledDate?: string;
  /** ISO 8601 — preenchido ao concluir a tarefa */
  completedAt?: string;
  /** Id do template quando a tarefa é instância de uma rotina recorrente. */
  routineTemplateId?: string;
  /** dayKey "YYYY-MM-DD" da geração da instância (dedup por dia). */
  routineDate?: string;
}
