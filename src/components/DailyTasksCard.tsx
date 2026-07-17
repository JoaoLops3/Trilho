import type { ReactNode } from "react";
import { ListChecks, Repeat } from "lucide-react";

interface DailyTasksCardProps {
  tasksCompleted: number;
  tasksTotal: number;
  routinesCompleted: number;
  routinesTotal: number;
}

function Segment({
  total,
  completed,
  colorClass,
}: {
  total: number;
  completed: number;
  colorClass: string;
}) {
  if (total <= 0) return null;

  const fillPercent = Math.round((completed / total) * 100);

  return (
    <div
      className="h-full min-w-0 overflow-hidden rounded-full"
      style={{ flex: total }}
    >
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  );
}

function Row({
  icon,
  label,
  completed,
  total,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  completed: number;
  total: number;
  iconClass: string;
}) {
  const done = total > 0 && completed === total;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.03] px-3 py-2.5">
      <span className={`shrink-0 ${iconClass}`}>{icon}</span>
      <span
        className={`min-w-0 flex-1 font-body text-sm text-obsidian-50 ${
          done ? "line-through opacity-50" : ""
        }`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 font-body text-[13px] ${
          done ? "text-mint-600" : "text-obsidian-500"
        }`}
      >
        {completed}/{total}
      </span>
    </div>
  );
}

export function DailyTasksCard({
  tasksCompleted,
  tasksTotal,
  routinesCompleted,
  routinesTotal,
}: DailyTasksCardProps) {
  const completedTotal = tasksCompleted + routinesCompleted;
  const total = tasksTotal + routinesTotal;

  return (
    <div className="card-glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-[12px] tracking-[0.04em] text-obsidian-500">
          Afazeres hoje
        </span>
        <span className="font-body text-[12px] text-obsidian-500">
          {completedTotal} de {total}
        </span>
      </div>

      <div className="mb-3 flex h-1.5 gap-[3px] overflow-hidden rounded-full bg-white/[0.08]">
        <Segment
          total={tasksTotal}
          completed={tasksCompleted}
          colorClass="bg-electric-500"
        />
        <Segment
          total={routinesTotal}
          completed={routinesCompleted}
          colorClass="bg-coral-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Row
          icon={<ListChecks size={16} strokeWidth={2} />}
          label="Tarefas"
          completed={tasksCompleted}
          total={tasksTotal}
          iconClass="text-electric-400"
        />
        <Row
          icon={<Repeat size={16} strokeWidth={2} />}
          label="Rotinas"
          completed={routinesCompleted}
          total={routinesTotal}
          iconClass="text-coral-400"
        />
      </div>
    </div>
  );
}
