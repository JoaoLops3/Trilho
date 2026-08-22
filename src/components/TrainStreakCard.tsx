import { useEffect } from "react";
import type { DayDot } from "../lib/day-stats";
import { themeColors } from "../lib/theme-colors";

type StreakState = "on-time" | "delayed" | "stopped";

interface TrainStreakCardProps {
  streakDays: number;
  recordDays: number;
  weekDots?: DayDot[];
  streakState?: StreakState;
}

function resolveState(days: number, dots: DayDot[]): StreakState {
  if (days === 0) return "stopped";
  const today = dots[dots.length - 1];
  if (today?.status === "today-partial") return "delayed";
  return "on-time";
}

const STATE_COLORS: Record<
  StreakState,
  {
    primary: string;
    dark: string;
    mid: string;
    light: string;
    label: string;
    trackSpeed: string;
  }
> = {
  "on-time": {
    primary: themeColors.mint[500],
    dark: themeColors.mint[600],
    mid: themeColors.mint[600],
    light: themeColors.mint[300],
    label: "trem no horário",
    trackSpeed: "0.55s",
  },
  delayed: {
    primary: themeColors.coral[400],
    dark: themeColors.coral[500],
    mid: themeColors.coral[500],
    light: themeColors.coral[300],
    label: "trem atrasado",
    trackSpeed: "0.9s",
  },
  stopped: {
    primary: themeColors.obsidian[500],
    dark: themeColors.obsidian[700],
    mid: themeColors.obsidian[600],
    light: themeColors.obsidian[300],
    label: "o trem voltou aos trilhos",
    trackSpeed: "0s",
  },
};

const DOT_COLORS: Record<DayDot["status"], { bg: string; outline?: string }> = {
  full: { bg: themeColors.mint[500] },
  partial: { bg: themeColors.coral[400] },
  empty: { bg: "transparent" },
  "today-full": {
    bg: themeColors.mint[500],
    outline: themeColors.mint[500],
  },
  "today-partial": {
    bg: themeColors.coral[400],
    outline: themeColors.coral[400],
  },
};

function TrainSVG({
  colors,
  animate,
  trackSpeed,
}: {
  colors: (typeof STATE_COLORS)["on-time"];
  animate: boolean;
  trackSpeed: string;
}) {
  const { primary, dark, mid, light } = colors;

  const styleId = "trilho-train-anim";
  useEffect(() => {
    if (!animate) return;
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes trilho-wheels {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes trilho-chug {
        0%,100% { transform: translateY(0px); }
        50%      { transform: translateY(-1.5px); }
      }
      @keyframes trilho-track {
        from { transform: translateX(0px); }
        to   { transform: translateX(-32px); }
      }
      @keyframes trilho-smoke1 {
        0%   { opacity: 0.9; transform: translate(0,0) scale(1); }
        100% { opacity: 0;   transform: translate(-22px,-14px) scale(1.6); }
      }
      @keyframes trilho-smoke2 {
        0%   { opacity: 0.55; transform: translate(0,0) scale(1); }
        100% { opacity: 0;    transform: translate(-28px,-18px) scale(1.8); }
      }
      @keyframes trilho-smoke3 {
        0%   { opacity: 0.28; transform: translate(0,0) scale(1); }
        100% { opacity: 0;    transform: translate(-34px,-22px) scale(2); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [animate]);

  const trackAnim =
    animate && trackSpeed !== "0s"
      ? { animation: `trilho-track ${trackSpeed} linear infinite` }
      : {};

  const chugStyle = animate
    ? { animation: "trilho-chug 0.5s ease-in-out infinite" }
    : {};
  const smoke1Style = animate
    ? {
        transformOrigin: "208px 13px",
        animation: "trilho-smoke1 1.2s ease-out infinite",
      }
    : { opacity: 0.9 };
  const smoke2Style = animate
    ? {
        transformOrigin: "207px 14px",
        animation: "trilho-smoke2 1.2s ease-out 0.3s infinite",
      }
    : { opacity: 0.55 };
  const smoke3Style = animate
    ? {
        transformOrigin: "206px 15px",
        animation: "trilho-smoke3 1.2s ease-out 0.6s infinite",
      }
    : { opacity: 0.28 };

  function Wheel({
    cx,
    cy,
    r,
    big,
  }: {
    cx: number;
    cy: number;
    r: number;
    big?: boolean;
  }) {
    const wheelStyle = animate
      ? {
          transformOrigin: `${cx}px ${cy}px`,
          animation: `trilho-wheels ${big ? "0.55" : "0.6"}s linear infinite`,
        }
      : {};
    return (
      <g style={wheelStyle}>
        <circle cx={cx} cy={cy} r={r} fill={dark} />
        <circle cx={cx} cy={cy} r={r * 0.5} fill={primary} />
        <line
          x1={cx}
          y1={cy - r}
          x2={cx}
          y2={cy + r}
          stroke={primary}
          strokeWidth={big ? 1.2 : 1}
        />
        <line
          x1={cx - r}
          y1={cy}
          x2={cx + r}
          y2={cy}
          stroke={primary}
          strokeWidth={big ? 1.2 : 1}
        />
      </g>
    );
  }

  const sleepers = Array.from({ length: 13 }, (_, i) => -16 + i * 32);

  return (
    <svg
      width="100%"
      viewBox="0 -24 320 92"
      role="img"
      aria-label="Ilustração do trem representando a sequência"
      className="block overflow-visible"
    >
      <defs>
        <clipPath id="trilho-clip">
          <rect x="0" y="44" width="320" height="16" />
        </clipPath>
      </defs>

      <line
        x1="0"
        y1="50"
        x2="320"
        y2="50"
        stroke={primary}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="56"
        x2="320"
        y2="56"
        stroke={primary}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <g clipPath="url(#trilho-clip)">
        <g style={trackAnim}>
          {sleepers.map((x) => (
            <line
              key={x}
              x1={x}
              y1="48"
              x2={x}
              y2="58"
              stroke={mid}
              strokeWidth="2.5"
            />
          ))}
        </g>
      </g>

      <g style={chugStyle}>
        <rect x="8" y="31" width="56" height="20" rx="3" fill={primary} />
        <rect x="6" y="46" width="60" height="5" rx="2" fill={mid} />
        <Wheel cx={20} cy={51} r={5} />
        <Wheel cx={56} cy={51} r={5} />
        <line x1="66" y1="41" x2="76" y2="41" stroke={dark} strokeWidth="2" />

        <rect x="76" y="31" width="62" height="20" rx="3" fill={primary} />
        <rect x="74" y="46" width="66" height="5" rx="2" fill={mid} />
        <Wheel cx={90} cy={51} r={5} />
        <Wheel cx={130} cy={51} r={5} />
        <line x1="140" y1="41" x2="150" y2="41" stroke={dark} strokeWidth="2" />

        <rect x="150" y="26" width="90" height="25" rx="3" fill={primary} />
        <rect x="148" y="17" width="30" height="34" rx="3" fill={mid} />
        <rect x="153" y="21" width="11" height="9" rx="1" fill={light} />
        <rect x="205" y="16" width="8" height="11" rx="2" fill={dark} />
        <line
          style={smoke1Style}
          x1="208"
          y1="13"
          x2="192"
          y2="5"
          stroke={light}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          style={smoke2Style}
          x1="207"
          y1="14"
          x2="188"
          y2="7"
          stroke={light}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          style={smoke3Style}
          x1="206"
          y1="15"
          x2="184"
          y2="10"
          stroke={light}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect x="236" y="30" width="12" height="17" rx="6" fill={dark} />
        <rect x="146" y="46" width="106" height="5" rx="2" fill={dark} />
        <Wheel cx={162} cy={51} r={6} big />
        <Wheel cx={186} cy={51} r={6} big />
        <Wheel cx={210} cy={51} r={6} big />
        <Wheel cx={234} cy={51} r={5} />
      </g>
    </svg>
  );
}

export function TrainStreakCard({
  streakDays,
  recordDays,
  weekDots,
  streakState,
}: TrainStreakCardProps) {
  const dots = weekDots ?? [];
  const state = streakState ?? resolveState(streakDays, dots);
  const colors = STATE_COLORS[state];
  const pct =
    recordDays > 0 ? Math.min(100, (streakDays / recordDays) * 100) : 0;

  return (
    <div className="card-premium px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="m-0 mb-1 text-xs uppercase tracking-wider text-obsidian-400">
            Sequência no trilho
          </p>
          <p className="m-0 text-3xl font-medium leading-tight text-obsidian-50">
            {streakDays} {streakDays === 1 ? "dia" : "dias"}
          </p>
          <p className="m-0 mt-1 text-sm" style={{ color: colors.mid }}>
            {colors.label}
          </p>
        </div>
        <div className="text-right">
          <p className="m-0 mb-0.5 text-xs text-obsidian-400">recorde</p>
          <p className="m-0 text-lg font-medium text-obsidian-400">
            {recordDays} dias
          </p>
        </div>
      </div>

      <div className="my-3 overflow-visible">
        <TrainSVG
          colors={colors}
          animate={state !== "stopped"}
          trackSpeed={colors.trackSpeed}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {dots.map((dot, i) => {
          const c = DOT_COLORS[dot.status];
          return (
            <div
              key={i}
              className={`h-6 w-6 rounded-full ${
                dot.status === "empty" ? "border border-obsidian-600" : ""
              }`}
              style={{
                backgroundColor: c.bg,
                outline: c.outline ? `2.5px solid ${c.outline}` : undefined,
                outlineOffset: c.outline ? 2 : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-surface-primary">
        <div
          className="h-full rounded-sm transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>
    </div>
  );
}
