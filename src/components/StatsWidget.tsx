import { motion } from "../lib/motion";
import { Clock } from "lucide-react";

export interface StatsWidgetData {
  focusValue: string;
  focusGoalLabel: string;
  focusProgress: number;
}

interface StatsWidgetProps {
  stats: StatsWidgetData;
  onViewStats?: () => void;
}

const cardTransition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

export function StatsWidget({ stats, onViewStats }: StatsWidgetProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...cardTransition, delay: 0 }}
      onClick={onViewStats}
      className="card-glass w-full p-4 text-left flex flex-col hover:bg-white/[0.04] transition-colors touch-manipulation"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-mint-500/30 to-mint-600/20">
          <Clock className="w-4 h-4 text-mint-400" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-obsidian-500 text-[13px] font-medium tracking-wider leading-tight truncate">
            Foco Hoje
          </p>
          <p className="font-display font-bold text-2xl text-white leading-tight">
            {stats.focusValue}
          </p>
        </div>
      </div>

      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full bg-mint-500"
          initial={{ width: 0 }}
          animate={{ width: `${stats.focusProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <p className="text-obsidian-500 text-xs truncate">
        {stats.focusGoalLabel}
      </p>
    </motion.button>
  );
}
