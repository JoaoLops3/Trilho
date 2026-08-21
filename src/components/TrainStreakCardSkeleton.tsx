export function TrainStreakCardSkeleton() {
  return (
    <div
      className="card-premium p-5 animate-pulse"
      aria-hidden="true"
      aria-label="Carregando dados de sequência"
    >
      {/* Header com dias */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-3 w-20 rounded-md bg-obsidian-700/50 mb-2" />
          <div className="h-8 w-24 rounded-md bg-obsidian-700/50 mb-2" />
          <div className="h-4 w-32 rounded-md bg-obsidian-800/50" />
        </div>
        <div>
          <div className="h-3 w-16 rounded-md bg-obsidian-800/50 mb-1" />
          <div className="h-5 w-20 rounded-md bg-obsidian-700/50" />
        </div>
      </div>

      {/* Ilustração do trem */}
      <div className="h-20 rounded-xl bg-obsidian-800/30 mb-3" />

      {/* Pontos da semana */}
      <div className="flex gap-2 mb-3">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-obsidian-700/50" />
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 rounded-full bg-obsidian-800/50" />
    </div>
  );
}
