import { motion } from "../lib/motion";

interface TaskCardSkeletonProps {
  index?: number;
  compact?: boolean;
}

export function TaskCardSkeleton({
  index = 0,
  compact = false,
}: TaskCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`card-premium ${compact ? "p-3" : "p-5"} animate-pulse`}
      aria-hidden="true"
      aria-label="Carregando tarefa"
    >
      <div className={`flex items-start ${compact ? "gap-3" : "gap-4"}`}>
        {/* Ícone/Avatar skeleton */}
        <div
          className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-2xl bg-obsidian-700/50`}
        />

        <div className="flex-1 min-w-0">
          {/* Badge + horário */}
          <div className={`flex items-center gap-2 ${compact ? "mb-1" : "mb-2"}`}>
            <div className="h-5 w-16 rounded-lg bg-obsidian-700/50" />
            <div className="h-3 w-12 rounded-md bg-obsidian-800/50" />
          </div>

          {/* Título */}
          <div
            className={`h-5 rounded-md bg-obsidian-700/50 ${compact ? "w-36 mb-1" : "w-48 mb-2"}`}
          />

          {/* Duração */}
          <div className="h-4 w-20 rounded-md bg-obsidian-800/50" />
        </div>

        {/* Menu skeleton */}
        <div className="w-5 h-5 rounded-full bg-obsidian-800/50" />
      </div>
    </motion.div>
  );
}

/**
 * Renderiza múltiplos skeletons de tarefas
 */
export function TaskCardSkeletonList({
  count = 3,
  compact = false,
}: {
  count?: number;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <TaskCardSkeleton key={i} index={i} compact={compact} />
      ))}
    </div>
  );
}
