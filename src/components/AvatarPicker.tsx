import { useEffect, useRef, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import type { AvatarPickerProps, AvatarStyle } from "../types/avatar";
import { Avatar } from "./Avatar";
import { buildAvatarUrl } from "../lib/avatar-url";

const STYLE: AvatarStyle = "toon-head";
const BATCH_SIZE = 8;

const actionButtonClass =
  "box-border flex flex-1 h-12 min-h-12 items-center justify-center rounded-2xl border px-4 text-sm font-medium touch-manipulation";

function createSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createBatch(initialSeed?: string | null): string[] {
  const seeds: string[] = [];
  if (initialSeed) seeds.push(initialSeed);
  while (seeds.length < BATCH_SIZE) {
    seeds.push(createSeed());
  }
  return seeds;
}

// Aquece o cache HTTP do WebView para o próximo lote (sem persistir nada em
// localStorage), deixando o "Gerar outras opções" praticamente instantâneo.
function prefetchBatch(seeds: string[]): void {
  if (typeof Image === "undefined") return;
  for (const seed of seeds) {
    const img = new Image();
    img.decoding = "async";
    img.src = buildAvatarUrl(STYLE, seed);
  }
}

export function AvatarPicker({
  initialSeed,
  onConfirm,
  onCancel,
  isSaving = false,
}: AvatarPickerProps) {
  const [seeds, setSeeds] = useState<string[]>(() => createBatch(initialSeed));
  const [selectedSeed, setSelectedSeed] = useState<string | null>(
    initialSeed ?? null,
  );
  const nextBatchRef = useRef<string[]>([]);

  useEffect(() => {
    const next = createBatch();
    nextBatchRef.current = next;
    prefetchBatch(next);
  }, [seeds]);

  const reroll = () => {
    const next =
      nextBatchRef.current.length > 0 ? nextBatchRef.current : createBatch();
    nextBatchRef.current = [];
    setSeeds(next);
    setSelectedSeed(null);
  };

  const handleConfirm = () => {
    if (!selectedSeed) return;
    onConfirm({ seed: selectedSeed, style: STYLE });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {seeds.map((seed, index) => {
          const isSelected = seed === selectedSeed;
          return (
            <button
              key={seed}
              type="button"
              onClick={() => setSelectedSeed(seed)}
              aria-label={`Avatar opção ${index + 1}`}
              aria-pressed={isSelected}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-white/[0.04] transition-all touch-manipulation ${
                isSelected
                  ? "ring-2 ring-mint-400"
                  : "ring-1 ring-white/10 hover:ring-white/20"
              }`}
            >
              <Avatar
                seed={seed}
                className="h-full w-full"
                alt={`Avatar opção ${index + 1}`}
              />
              {isSelected && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-mint-400 text-surface-primary shadow">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={reroll}
        disabled={isSaving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-obsidian-200 transition-colors hover:bg-white/[0.08] disabled:opacity-40 touch-manipulation"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
        Gerar outras opções
      </button>

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={`${actionButtonClass} border-white/25 bg-white/[0.04] text-obsidian-200 transition-colors hover:border-white/35 hover:bg-white/[0.08] disabled:opacity-40`}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedSeed || isSaving}
          className={`${actionButtonClass} btn-primary !px-4 !py-0 border-transparent disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isSaving ? "Salvando…" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
