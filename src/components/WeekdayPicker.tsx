interface WeekdayPickerProps {
  /** Dias selecionados: 0 (dom) … 6 (sáb). */
  value: number[];
  onChange: (weekdays: number[]) => void;
}

// Exibe dom→sáb; os values seguem Date.getDay() (0=dom … 6=sáb).
const WEEKDAYS: { value: number; label: string; full: string }[] = [
  { value: 0, label: "D", full: "Domingo" },
  { value: 1, label: "S", full: "Segunda" },
  { value: 2, label: "T", full: "Terça" },
  { value: 3, label: "Q", full: "Quarta" },
  { value: 4, label: "Q", full: "Quinta" },
  { value: 5, label: "S", full: "Sexta" },
  { value: 6, label: "S", full: "Sábado" },
];

export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex gap-1.5">
      {WEEKDAYS.map((weekday) => {
        const selected = value.includes(weekday.value);
        return (
          <button
            key={weekday.value}
            type="button"
            onClick={() => toggle(weekday.value)}
            aria-pressed={selected}
            aria-label={weekday.full}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium transition-colors touch-manipulation ${
              selected
                ? "bg-mint-500/20 text-mint-400 border border-mint-500/60"
                : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            {weekday.label}
          </button>
        );
      })}
    </div>
  );
}
