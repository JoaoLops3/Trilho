export function StatsWidgetSkeleton() {
  return (
    <div className="card-premium p-5 animate-pulse" aria-hidden="true">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-3 w-24 rounded-md bg-obsidian-700/50 mb-2" />
          <div className="h-8 w-32 rounded-md bg-obsidian-700/50" />
        </div>
        <div className="w-16 h-16 rounded-full bg-obsidian-700/50" />
      </div>

      {/* Barra de progresso */}
      <div className="h-2 rounded-full bg-obsidian-800/50" />
    </div>
  );
}
