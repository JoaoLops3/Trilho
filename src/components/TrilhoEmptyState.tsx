/**
 * Empty state alinhado à metáfora do trilho (partida / via livre).
 */
interface TrilhoEmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

export function TrilhoEmptyState({
  title,
  description,
  className = "",
}: TrilhoEmptyStateProps) {
  return (
    <div
      className={`card-glass flex flex-col items-center justify-center px-6 py-6 text-center ${className}`}
      role="status"
    >
      <p className="m-0 font-display text-base font-medium text-white">
        {title}
      </p>
      <p className="mt-1 mb-0 text-sm text-obsidian-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
