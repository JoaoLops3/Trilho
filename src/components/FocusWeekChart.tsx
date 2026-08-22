import { motion } from "../lib/motion";
import { dayKey, type DayStat } from "../lib/day-stats";
import { RailMark } from "./RailMark";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const BAR_AREA_HEIGHT_PX = 72;
const MIN_FOCUS_BAR_HEIGHT_PX = 6;

type LegendSwatch = "filled" | "today";

const LEGEND_SWATCH_CLASS: Record<LegendSwatch, string> = {
  filled: "bg-white/10",
  today: "bg-gradient-to-t from-mint-500 to-mint-400",
};

function ChartLegendItem({
  swatch,
  label,
}: {
  swatch: LegendSwatch;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`block h-2 w-2 shrink-0 rounded-full ${LEGEND_SWATCH_CLASS[swatch]}`}
        aria-hidden
      />
      <span className="text-[10px] text-obsidian-500">{label}</span>
    </div>
  );
}

function ChartLegend() {
  return (
    <div
      className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
      aria-label="Legenda do gráfico de foco"
    >
      <ChartLegendItem swatch="filled" label="Com foco" />
      <ChartLegendItem swatch="today" label="Hoje" />
    </div>
  );
}

function lastSevenDays(
  history: DayStat[],
  todayFocusSeconds?: number,
): DayStat[] {
  const byDate = new Map(history.map((d) => [d.date, d]));
  const days: DayStat[] = [];
  const cursor = new Date();
  const today = dayKey();
  cursor.setDate(cursor.getDate() - 6);
  for (let i = 0; i < 7; i += 1) {
    const key = dayKey(cursor);
    const stored =
      byDate.get(key) ?? { date: key, tasksCompleted: 0, focusSeconds: 0 };
    days.push(
      key === today && todayFocusSeconds !== undefined
        ? { ...stored, focusSeconds: todayFocusSeconds }
        : stored,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export interface FocusWeekChartProps {
  history: DayStat[];
  /** Foco ao vivo de hoje (timer), para não depender só do snapshot em localStorage. */
  todayFocusSeconds?: number;
}

export function FocusWeekChart({
  history,
  todayFocusSeconds,
}: FocusWeekChartProps) {
  const week = lastSevenDays(history, todayFocusSeconds);
  const maxFocus = Math.max(...week.map((d) => d.focusSeconds), 1);
  const todayKey = dayKey();
  const isWeekEmpty = week.every((d) => d.focusSeconds === 0);

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        {week.map((day) => {
          const hasFocus = day.focusSeconds > 0;
          const barHeightPx = Math.max(
            Math.round((day.focusSeconds / maxFocus) * BAR_AREA_HEIGHT_PX),
            MIN_FOCUS_BAR_HEIGHT_PX,
          );
          const isToday = day.date === todayKey;
          const weekday =
            WEEKDAY_LABELS[new Date(`${day.date}T00:00:00`).getDay()];
          const minutes = Math.floor(day.focusSeconds / 60);

          return (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                className="relative flex w-full items-end justify-center"
                style={{ height: BAR_AREA_HEIGHT_PX }}
              >
                {hasFocus && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeightPx }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`relative z-10 w-full max-w-[24px] rounded-t-lg ${
                      isToday
                        ? "bg-gradient-to-t from-mint-500 to-mint-400"
                        : "bg-white/10"
                    }`}
                    title={`${minutes} min`}
                  />
                )}
              </div>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isToday ? "bg-mint-400" : "bg-obsidian-600"
                }`}
                aria-hidden
              />
              <span
                className={`text-[10px] uppercase tracking-wide ${
                  isToday ? "text-mint-400" : "text-obsidian-500"
                }`}
              >
                {weekday}
              </span>
            </div>
          );
        })}
      </div>

      <RailMark className="mt-1" tone="muted" sleeperCount={11} />

      <ChartLegend />

      {isWeekEmpty && (
        <p className="mt-2 text-center text-obsidian-500 text-xs">
          Comece uma sessão de foco para preencher seu trilho
        </p>
      )}
    </div>
  );
}
