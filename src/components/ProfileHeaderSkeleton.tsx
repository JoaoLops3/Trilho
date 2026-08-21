export function ProfileHeaderSkeleton() {
  return (
    <div className="card-glass p-6 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <div className="w-20 h-20 rounded-full bg-obsidian-700/50" />

        <div className="flex-1">
          {/* Nome */}
          <div className="h-6 w-32 rounded-md bg-obsidian-700/50 mb-2" />
          {/* Sequência */}
          <div className="h-4 w-24 rounded-md bg-obsidian-800/50" />
        </div>
      </div>
    </div>
  );
}
