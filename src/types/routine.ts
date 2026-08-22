import type { TaskPriority } from "./task";

/** Template de rotina recorrente: gera instâncias de Task nos dias configurados. */
export interface RoutineTemplate {
  id: string;
  title: string;
  category: string;
  duration: number;
  priority: TaskPriority;
  scheduledTime?: string;
  /** Dias da semana em que gera instância: 0 (dom) … 6 (sáb), não vazio. */
  weekdays: number[];
  active: boolean;
  createdAt: string;
}

/** Dados de criação de rotina (sem id/createdAt) — contrato consumido pela Fase 12. */
export interface RoutineTemplateInput {
  title: string;
  category: string;
  duration: number;
  priority: TaskPriority;
  scheduledTime?: string;
  weekdays: number[];
  active?: boolean;
}
