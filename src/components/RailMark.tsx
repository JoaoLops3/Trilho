/**
 * Motivo visual de assinatura do Trilho: dois trilhos + dormentes.
 * Uso decorativo (aria-hidden) — um por composição, não em todo card.
 */
type RailTone = "mint" | "muted" | "electric";

const TONE_CLASS: Record<RailTone, { rail: string; sleeper: string }> = {
  mint: {
    rail: "bg-mint-500/55",
    sleeper: "bg-mint-500/35",
  },
  muted: {
    rail: "bg-obsidian-600",
    sleeper: "bg-obsidian-700",
  },
  electric: {
    rail: "bg-electric-400/50",
    sleeper: "bg-electric-500/30",
  },
};

interface RailMarkProps {
  className?: string;
  /** Intensidade / cor do trilho. */
  tone?: RailTone;
  /** Densidade dos dormentes (mais = mais “via”). */
  sleeperCount?: number;
}

export function RailMark({
  className = "",
  tone = "mint",
  sleeperCount = 7,
}: RailMarkProps) {
  const colors = TONE_CLASS[tone];
  const sleepers = Array.from({ length: sleeperCount }, (_, i) => i);

  return (
    <div
      className={`relative h-3 w-full overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className={`absolute left-0 right-0 top-[3px] h-[1.5px] rounded-full ${colors.rail}`}
      />
      <div
        className={`absolute left-0 right-0 bottom-[3px] h-[1.5px] rounded-full ${colors.rail}`}
      />
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-between px-0.5">
        {sleepers.map((i) => (
          <span
            key={i}
            className={`block h-2.5 w-[2px] rounded-sm ${colors.sleeper}`}
          />
        ))}
      </div>
    </div>
  );
}

interface SectionRailHeadingProps {
  title: string;
  meta?: string;
}

/**
 * Título de seção da home — copy no idioma do trilho, sem ornamento sob o título.
 */
export function SectionRailHeading({ title, meta }: SectionRailHeadingProps) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3 px-1">
      <h2 className="m-0 font-display text-base font-semibold text-white">
        {title}
      </h2>
      {meta ? (
        <span className="shrink-0 text-sm text-obsidian-500">{meta}</span>
      ) : null}
    </div>
  );
}
